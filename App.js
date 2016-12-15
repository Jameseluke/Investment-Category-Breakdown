Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    height: 600,
    border: 2,
    
    launch: function() {
        //Write app code here
        this._investmentSeries = [];
        this._epicSeries = [];
        this._investmentDrilldown = {};
        this.add({
            xtype: 'container',
            itemId: 'toggleContainer',
        });
        this.add({
            xtype: 'container',
            itemId: 'settingsContainer',
            id: 'settings',
            cls: 'settings'
        });
        this.add({
            xtype: 'container',
            itemId: 'reportContainer',
            cls: 'report'
        });
        
         
        this._addSettings();
        this._loadEpics();
        this._hidden = true;
        //API Docs: https://help.rallydev.com/apps/2.1/doc/
    },
    
    _addSettings: function() {
        
    },
    
    _loadEpics: function() {
        this.store = Ext.create('Rally.data.wsapi.artifact.Store', {
            models: ['PortfolioItem/Epic'],
            fetch: ['FormattedID', 'Name', 'LeafStoryPlanEstimateTotal', 'InvestmentCategory', '_ref'],
            filters: [],//this.context.getTimeboxScope().getQueryFilter()],
            sorters: [
                {property: 'InvestmentCategory'}
            ],
            context: this.context.getDataContext(),
            limit: Infinity,
            requester: this,
            autoLoad: true,
            listeners: {
                load: this._onAllDataLoaded,
                scope: this
            }
        });
    },
    
    _test: function(record){
        console.log(record.get("FormattedID"));
    },
    
    _addEpicToChart: function(record) {
        var category = record.get('InvestmentCategory');
        var data = {
                name: record.get('FormattedID'),
                y: record.get('LeafStoryPlanEstimateTotal'),
                rallyName: record.get('Name'),
                status: category,
                ref: record.get('_ref')
            };
        if(this._investmentDrilldown[category] === undefined){
            this._investmentDrilldown[category] = {
                name: category,
                id: category,
                data: [data]
            };
        }
        
        else {
            this._investmentDrilldown[category]["data"].push(data);
        }
        
        var temp = JSON.parse(JSON.stringify(data));
        temp["color"] = this._colorFromInvestment(category);
        this._epicSeries.push(temp);
    },
    
    
    _formatData: function() {
        var that = this;
        _.each(this._investmentDrilldown, function(value){
            var total = 0;
            _.each(value["data"], function(datapoint){
                total += datapoint["y"];
            });
            that._investmentSeries.push({
                name: value["name"],
                id: value["id"],
                color: that._colorFromInvestment(value["name"]),
                y: total
            });
        });
    },
    
    _onAllDataLoaded: function() {
        var records = this.store.getRange();
        var that = this;
        
        var states = Ext.create('Ext.data.Store', {
                                    fields: ['grouper', 'epicornah'],
                                    data : [
                                        {'grouper': 'Epic', 'epicornah': true},
                                        {'grouper': 'Investment Category', 'epicornah': false},
                                    ]
                                });
         var format = Ext.create('Ext.data.Store', {
                                    fields: ['grouper', 'storyornah'],
                                    data : [
                                        {'grouper': 'Percentage', 'storyornah': false},
                                        {'grouper': 'Plan Estimate', 'storyornah': true},
                                    ]
                                });
                                
         this.down('#toggleContainer').add(
            Ext.create('Ext.Button', {
                text: 'Show Settings',
                id: 'hide',
                handler: function() {
                    if(!that._hidden){
                        Ext.getCmp('settings').hide();
                        this.setText('Show Settings');
                    }
                    else {
                        Ext.getCmp('settings').show();
                        this.setText('Hide Settings');
                    }
                    that._hidden = !that._hidden;
                }
            })
         );
        
                                
        this.down('#settingsContainer').add(
            Ext.create('Ext.form.ComboBox', {
                id: 'group',
                fieldLabel: 'Group By:',
                store: states,
                queryMode: 'local',
                displayField: 'grouper',
                valueField: 'epicornah',
                value: false
            })
        );
        
        this.down('#settingsContainer').add(
            Ext.create('Ext.form.ComboBox', {
                id: 'format',
                fieldLabel: 'Format:',
                store: format,
                queryMode: 'local',
                displayField: 'grouper',
                valueField: 'storyornah',
                value: false
            })
        );
        
         this.down('#settingsContainer').add({
            xtype: 'checkboxgroup',
            fieldLabel: '',
            id: 'check',
            columns: 1,
            vertical: true,
            // Arrange checkboxes into two columns, distributed vertically
            items: [
                { boxLabel: 'Show Labels', name: 'lb', inputValue: '1', checked: true },
                { boxLabel: 'Show Tooltips', name: 'tt', inputValue: '2', checked: true },
            ]
        });
        
        this.down('#settingsContainer').add(
            Ext.create('Ext.Button', {
                text: 'Generate',
                handler: function() {
                    that.down('#settingsContainer').remove('backbutton');
                   that.down('#reportContainer').remove('chart');
                   var chart = that._createChartConfig(that._investmentSeries, Ext.getCmp('group').getValue(), Ext.getCmp('group').getValue(),  Ext.getCmp('format').getValue(), 'Plan Estimate by Investment Category', false);
                   that.down('#reportContainer').add(chart);
                }
            })
         );
         
        Ext.getCmp('settings').hide();
        _.each(records, function(record) {
           that._addEpicToChart(record);
        });
        
        this._formatData();
        var chart = this._createChartConfig(this._investmentSeries,Ext.getCmp('group').getValue(), Ext.getCmp('group').getValue(),  Ext.getCmp('format').getValue(), 'Plan Estimate by Investment Category');
        this.down('#reportContainer').add(chart);
    },
    
    _createBackButton: function(){
        var that = this;
        this.down('#toggleContainer').add(
            Ext.create('Ext.Button', {
                id: 'backbutton',
                text: 'Back',
                renderTo: Ext.getBody(),
                handler: function() {
                   that.down('#reportContainer').remove('chart');
                   var chart = that._createChartConfig(that._investmentSeries, Ext.getCmp('group').getValue(), Ext.getCmp('group').getValue(),  Ext.getCmp('format').getValue(), 'Plan Estimate by Investment Category', false);
                   that.down('#reportContainer').add(chart);
                   that.down('#toggleContainer').remove('backbutton');
                }
            })
         );
        Ext.getCmp('backbutton').center();
    },
    
    _colorFromInvestment: function(category) { //refactor into css and classes, should get cleaner
        var progressColors = {
            "None": "#c56f64",
            "Short Term Growth": "#5faf4c", 
            "Strategic Growth": "#7963cb", 
            "Cost Savings": "#b5b246", 
            "Maintenance": "#c063ba", 
            "Reduce Errors & Fallouts": "#4bae8f", 
            "Order Tracking": "#cd4739", 
            "Reduced Time to Service": "#678ecd", 
            "Reduce Operational Cost": "#d08940", 
            "Product Changes": "#c75481", 
            "Technology & Capacity": "#737632"
        };
        return progressColors[category];
    },
    
    _formatTooltip: function(){
        var additional = (this.point.rallyName) ? this.point.rallyName + "<br />" : "";
        return "<b>" + this.point.name + "</b><br />" + additional + "<b>Plan Estimate:</b> " + this.y + "<br /><b>Percentage of Investment:</b> " + this.percentage.toFixed(1) + "%";
    },
    _createChartConfig: function(dataseries, detailed, byEpic, byEstimate, title, drilled) {
        var me = this;
        var clickChartHandler = _.isFunction(this.clickHandler) ? this.clickHandler : Ext.emptyFn;
        var height = this.height;
        var pieHeight = this.height * 0.65;
        var settings = Ext.getCmp('check').getValue();
        return Ext.Object.merge({
            xtype: 'rallychart',
            itemId: 'chart',
            loadMask: false,
            chartData: {
                series: [{
                        type: 'pie',
                        name: 'Category',
                        visible: !detailed,
                        data: dataseries,
                        size: pieHeight,
                        showInLegend: false,
                        allowPointSelect: false,
                        dataLabels: {
                            enabled: settings["lb"],
                            formatter: function() {
                                var label = (byEpic) ? this.point.rallyName : this.point.name;
                                if (this.y !== 0) {
                                    if(!byEstimate){
                                        return "<b>" + label + ":</b> " + this.percentage.toFixed(1) + "%"; //'<b>{point.name}</b>: {point.percentage:.1f}';
                                    }
                                    else {
                                        return "<b>" + label + ":</b> " + this.y; //'<b>{point.name}</b>: {point.percentage:.1f}';
                                    }
                                  
                                } else {
                                  return null;
                                }
                            },
                            style: {
                                color: 'black'
                            }
                        }
                    },
                     {
                        type: 'pie',
                        name: 'Category',
                        data: this._investmentSeries,
                        showInLegend: !drilled,
                        size: pieHeight,
                        visible: !drilled,
                        allowPointSelect: false,
                        dataLabels: { enabled: false }
                    },
                    {
                        type: 'pie',
                        name: 'Epics',
                        data: this._epicSeries,
                        size: pieHeight,
                        visible: detailed,
                        allowPointSelect: false,
                        showInLegend: false,
                        dataLabels: {
                            enabled: settings["lb"],
                            formatter: function() {
                                 if (this.y !== 0) {
                                    if(!byEstimate){
                                        return "<b>" + this.point.name + ":</b> " + this.percentage.toFixed(1) + "%"; //'<b>{point.name}</b>: {point.percentage:.1f}';
                                    }
                                    else {
                                        return "<b>" + this.point.name + ":</b> " + this.y; //'<b>{point.name}</b>: {point.percentage:.1f}';
                                    }
                                  
                                } else {
                                  return null;
                                }
                            },
                            style: {
                                color: 'black'
                            }
                        }
                    }]
            },

            chartConfig: {
                chart: {
                    type: 'pie',
                    height: height,
                    width: this.width,
                    spacingTop: 10,
                    spacingRight: 3,
                    spacingBottom: 30,
                    spacingLeft: 3,
                    events: {
                        click: clickChartHandler
                    }
                },
                /*subtitle: {
                    useHTML: true,
                    text: '<table align="center" class="pie-chart-legend"><tr>'+
                    '<td><span class="legend-swatch none-sample-swatch"></span><span>None</td>' +
                    '<td><span class="legend-swatch short-sample-swatch"></span>Short Term Growth</td>' +
                    '<td><span class="legend-swatch strategic-sample-swatch"></span>Strategic Growth</td>' +
                    '<td><span class="legend-swatch cost-sample-swatch"></span>Cost Savings</td>'+
                    '<td><span class="legend-swatch maintenance-sample-swatch"></span><span>Maintenance</td>' +
                    '<td><span class="legend-swatch errors-sample-swatch"></span>Reduce Errors & Fallouts</td></tr>' +
                    '<td><span class="legend-swatch order-sample-swatch"></span>Order Tracking</td>' +
                    '<td><span class="legend-swatch time-sample-swatch"></span>Reduced Time to Service</td>'+
                    '<td><span class="legend-swatch operational-sample-swatch"></span><span>Reduce Operational Cost</td>' +
                    '<td><span class="legend-swatch product-progress-sample-swatch"></span>Product Changes</td>' +
                    '<td><span class="legend-swatch tech-sample-swatch"></span>Technology & Capacity</td></tr></table>',
                    verticalAlign: 'bottom',
                    floating: false,
                    align: "center",
                    x: 0,
                    y: -50
                },*/
                tooltip: {
                    enabled: settings["tt"],
                    formatter: this._formatTooltip,
                    useHTML: true
                },
                spacingTop: 0,
                title: { text: title, color: 'black'},
                plotOptions: {
                    pie: {
                        animation: false,
                        cursor: 'pointer',
                        shadow: false,
                        center: ['50%', '45%'],
                        point: {
                            events: {
                                click: function() {
                                    var ref = this.ref;
                                    if (ref) {
                                        var url = Rally.nav.Manager.getDetailUrl(ref);
                                         window.open(url,'_blank');
                                        //Rally.nav.Manager.showDetail(ref);
                                    } else {
                                        var category = this.name;
                                        console.log(category);
                                        me.down('#reportContainer').remove('chart');
                                        console.log(me._investmentDrilldown[category]["data"]);
                                        var chart = me._createChartConfig(me._investmentDrilldown[category]["data"], false, true, Ext.getCmp('format').getValue(), category, true);
                                        me.down('#reportContainer').add(chart);
                                        me.down(me._createBackButton());
                                    }
                                }
                            }
                        },
                        showInLegend: !byEpic
                    }
                }
            }
        }, {});
    },
});

