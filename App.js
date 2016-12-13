Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    height: 600,
    border: 2,
    
    launch: function() {
        //Write app code here
        this._chartData = [];
        this._investmentData = [];
        this._investmentCategories = [];
        this._investmentIndex = 0;
        this.add({
            xtype: 'container',
            itemId: 'reportContainer'
        });
        this._loadEpics();
        
        //API Docs: https://help.rallydev.com/apps/2.1/doc/
    },
    
    _loadEpics: function() {
        console.log(Array.isArray(this._chartData));
        this.store = Ext.create('Rally.data.wsapi.artifact.Store', {
            models: ['PortfolioItem/Epic'],
            fetch: ['FormattedID', 'Name', 'LeafStoryPlanEstimateTotal', 'InvestmentCategory'],
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
        var color = this._colorFromInvestment(record.get('InvestmentCategory'));
        this._chartData.push({
                name: record.get('FormattedID'),
                y: record.get('LeafStoryPlanEstimateTotal'),
                color: color,
                rallyName: record.get('Name'),
                status: record.get('InvestmentCategory'),
                ref: record.get('_ref')
        });
    },
    
    _onAllDataLoaded: function() {
        var records = this.store.getRange();
        var that = this;
        _.each(records, function(record) {
           that._addEpicToChart(record);
           console.log(record.get('InvestmentCategory'));
        });
        console.log(this._chartData);
        var chart = this._createChartConfig();
        this.down('#reportContainer').add(chart);
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
    
    _createChartConfig: function(overrides) {
        var me = this;
        var clickChartHandler = _.isFunction(this.clickHandler) ? this.clickHandler : Ext.emptyFn;
        var height = this.height;
        var pieHeight = this.height * 0.65;

        return Ext.Object.merge({
            xtype: 'rallychart',
            loadMask: false,
            chartData: {
                series: [
                    {
                        type: 'pie',
                        name: 'Epics',
                        data: this._chartData,
                        size: pieHeight,
                        allowPointSelect: false,
                        dataLabels: {
                            enabled: true,
                            formatter: function() {
                                if (this.y !== 0) {
                                  return "<b>" + this.point.name + ":</b> " + this.percentage.toFixed(1) + "%"; //'<b>{point.name}</b>: {point.percentage:.1f}';
                                } else {
                                  return null;
                                }
                            },
                            style: {
                                color: 'black'
                        }
                }

                    }
                    /*{
                        type: 'pie',
                        name: 'Children',
                        data: this._childChartData,
                        size: pieHeight,
                        innerSize: 0.8 * pieHeight,
                        allowPointSelect: false,
                        dataLabels: { enabled: false }
                    }*/
                ]
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
                subtitle: {
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
                },
                tooltip: {/*
                    formatter: this._formatTooltip,
                    useHTML: true*/
                },
                spacingTop: 0,
                title: { text: null },
                plotOptions: {
                    pie: {
                        cursor: 'pointer',
                        shadow: false,
                        center: ['50%', '45%'],
                        point: {
                            events: {
                                click: function() {
                                    var ref = this.ref;
                                    if (ref) {
                                        me.up('rallydialog').destroy();
                                        Rally.nav.Manager.showDetail(ref);
                                    }
                                }
                            }
                        },
                        showInLegend: false
                    }
                }
            }
        }, overrides || {});
    },
});
