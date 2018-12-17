/*** @jsx React.DOM */
class Axis extends React.Component {
  constructor(props) {
    super(props);
    this.computeBinSize = this.computeBinSize.bind(this);
    this.getBrush = this.getBrush.bind(this);
  }

  computeBinSize() {
      var numRange = this.props.axis.domain()[1];
      let binSize = this.props.height/(numRange);
      return binSize;
  }

  getBrush(binSize) {
      var that = this;
      var brush = d3.brushY()
          .extent([[-8, 0], [8, this.props.height]])
          .on("start", function (e) {
          })
          .on("brush", function () {
          })
          .on("end", function () {
              if (!d3.event.sourceEvent) return;
              if (that.props.isNominal) {
                  let binSize = that.computeBinSize();
                  var top = Math.floor(d3.event.selection[0] / binSize) * binSize;
                  var bottom = Math.floor(d3.event.selection[1] / binSize) * binSize;
                  d3.select(this).transition().call(d3.event.target.move, [top, bottom]);
                  that.props.setFeatureDisplayRange([top, bottom], [Math.floor(d3.event.selection[0] / binSize), Math.floor(d3.event.selection[1] / binSize)]);
              } else {
                  let domain = that.props.axis.domain();
                  var rangeTop = d3.event.selection[0] / that.props.height * (domain[1] - domain[0]) + domain[0];
                  var rangeBottom = d3.event.selection[1] / that.props.height * (domain[1] - domain[0]) + domain[0];
                  that.props.setFeatureDisplayRange(d3.event.selection, [rangeTop, rangeBottom]);
              }
          });
      return brush;
  }

  componentDidMount() {
      var that = this;
    var id = '#' + this.props.name;
    var axisG = d3.select(id);
    axisG.call(d3.axisRight(this.props.axisDisplay));
    axisG.append("g").attr('class', 'axis-brush');
    var axisBrush = axisG.select('.axis-brush');

    if (this.props.name == 'BOUNDARY') {
        //var g = d3.select(id);
        axisG.select("path").attr("stroke", "darkgrey").attr("stroke-width", 5);
        axisG.select(".tick").style("display", "none")
    } else {
        var brush = this.getBrush();
        axisBrush.call(brush);
        //brush.move(d3.select(id).select('.axis-brush'), [10, 500]);

    }
  }

  shouldComponentUpdate(nextProps, nextState) {
      return nextProps.name != this.props.name || nextProps.transform != this.props.transform;
  }

  componentDidUpdate() {
    var that = this;
    var id = '#' + this.props.name;
    d3.select(id).selectAll('.tick').remove();

    var axisG = d3.select(id).call(d3.axisRight(this.props.axisDisplay));
    d3.select(id).select('.axis-brush').remove();
    axisG.append("g").attr('class', 'axis-brush');
    var axisBrush = axisG.select('.axis-brush');
    //let binSize = this.computeBinSize();

    var g = d3.select(id);
    if (this.props.name == 'BOUNDARY') {
        g.select("path").attr("stroke", "darkgrey").attr("stroke-width", 5);
        g.select(".tick").style("display", "none")
    } else {
        g.select("path").attr("stroke", "black").attr("stroke-width", 1);
        var brush = this.getBrush();
        axisBrush.call(brush);
        if (that.props.extent[0] != 0 || that.props.extent[1] != 0) {
            brush.move(d3.select(id).select('.axis-brush'), that.props.extent);
        }
    }
  }

  render(){
    console.log('feature-axis');
    const textColor = this.props.name == "BOUNDARY" ? "darkgrey": "black";
    return (
      <g className={'feature-axis'} id={this.props.name} transform={this.props.transform}>
        <text x={10} y={-5} transform={'rotate(-45)'} fill={textColor} style={{fontWeight: "bold"}} >{this.props.textname}</text>
      </g>
    )
  }
}

class FeatureParallelCoordinates extends React.Component {
  constructor(props) {
    console.log(props)
    super(props)
    var margin = {left: 10, right: 30, top: 100, bottom:10};
    var width = props.size[0] - margin.left - margin.right;
    var height = 570 - margin.top - margin.bottom;
    var axisWidth = 30;
      var yScalesDisplay = {};
      var yScalesAxesDisplay = {};
      var displayRanges = {};
      var extent = {};
      for (var i = 0; i < this.props.features.length; i++) {
          if (this.props.features[i].type == 'continuous') {
              const scale = d3.scaleLinear().domain(this.props.features[i].range).range([0, height]);
              yScalesDisplay[this.props.features[i].name] = scale;
              yScalesAxesDisplay[this.props.features[i].name] = scale;
              displayRanges[this.props.features[i].index] = this.props.features[i].range;
              extent[this.props.features[i].name] = [0,0];
          }
          else {
              const numSplits = this.props.features[i].values.length;
              const rangeDomain = this.props.features[i].values.map((v, i) => i * height / numSplits);
              rangeDomain.push(height);
              yScalesAxesDisplay[this.props.features[i].name] = d3.scaleOrdinal().domain(this.props.features[i].values).range(rangeDomain);
              yScalesDisplay[this.props.features[i].name] = d3.scaleLinear().domain([0, this.props.features[i].values.length]).range([0, height]);
              displayRanges[this.props.features[i].index] = [0, this.props.features[i].values.length];
              extent[this.props.features[i].name] = [0,0];
          }
      }

    this.state = {
      margin: margin,
      width: width,
      height: height,
      yScalesDisplay: yScalesDisplay,
      yScalesAxesDisplay: yScalesAxesDisplay,
      displayRanges: displayRanges,
      axisWidth: axisWidth,
      extent: extent
    };

    this.path = this.path.bind(this);
    this.setFeatureDisplayRange = this.setFeatureDisplayRange.bind(this);
    this.highlightSelected = this.highlightSelected.bind(this);
    this.inRange = this.inRange.bind(this);
  }

  componentDidMount() {
    var that = this;
    //console.log(d3.selectAll('.feature-axis'))
    d3.selectAll(".feature-axis").call(d3.drag()
      .on("start", function(d) {
        //that.state.dragging[attrId] = that.state.xScale(attrId)
      })
      .on("drag", function(d) {
        d3.select(this).attr('transform', function(d) { return 'translate(' + d3.event.x + ")" })
      })
      .on("end", function(d) {
        that.props.featureAxisOnEnd(this)
      })
    )

    d3.selectAll('.feature-axis')
        .selectAll('.tick')
        .selectAll('text')
        .attr("transform", "translate(0,40) rotate(-45)")
  }

  componentDidUpdate() {
    var that = this;
      d3.selectAll('.feature-axis')
          .selectAll('.tick')
          .selectAll('text')
          .attr("transform", "translate(0,40) rotate(-45)")

    /*var selection = d3.select(".feature-parallels")
      .selectAll(".datapath")
      .data(that.props.data)
      .attr("d", function(d) {return that.path(d.features, that.state.draw)})
      .attr("fill", "none")
      .attr("stroke", function(d){ return that.props.colorFunction(d.target) })

    selection.enter()
      .append('path')
      .attr("d", function(d) {return that.path(d.features, that.state.draw)})
      .attr("fill", "none")
      .attr("stroke", function(d){ return that.props.colorFunction(d.target) })

    selection.exit().remove()*/
  }

  path(data, yScalesDisplay) {
    var xScale = this.props.xScale;
    //var yScalesDisplay = this.state.yScalesDisplay;
    var draw = d3.line()
      .x(function(d) {
        return xScale(d[0])
      })
      .y(function(d) {
        return yScalesDisplay[d[0]](d[1])
      });

    var drawData = [];
    for (var i = 0; i < this.props.xScaleDomain.length; i++) {

      if (this.props.xScaleDomain[i] == "BOUNDARY") {
        break;
      } else {
        drawData.push([this.props.xScaleDomain[i], data[this.props.nameToIndexMap[this.props.xScaleDomain[i]]]])
      }
    }
    return draw(drawData)
  }

  setFeatureDisplayRange(featureArrayIndex, featureName, extent, range) {
      this.state.extent[featureName] = extent;
      this.state.displayRanges[featureArrayIndex] = range;
      this.setState({
          displayRanges: this.state.displayRanges,
          extent: this.state.extent
      })
  }

  inRange(value, range) {
      if (range[0] == range[1]) {
          return true;
      }
      if (value >= range[0] && value <= range[1]){
          return true;
      }
      return false
  }

  highlightSelected() {
      this.state.displayRanges;
      this.props.convertedData.map((ex) => {
          var featureArrayIndex = 0;
          ex.display = true;
          while (featureArrayIndex < this.props.features.length - 1 && ex.display == true) {
              if (this.inRange(ex.data[featureArrayIndex], this.state.displayRanges[featureArrayIndex]) == false ||
                  this.props.classDisplay[ex.target].TP.display == false) {
                  ex.display = false;
              }
              featureArrayIndex = featureArrayIndex + 1;
          }
      })
  }

  render(){
    console.log('render feature parallels');
    console.log(this.props);
    this.highlightSelected();
    var displayExamples = this.props.convertedData.filter(data => data.display == true);
    var unDisplayExamples = this.props.convertedData.filter(data => data.display == false);
    return (
        <div width={1000} style={{overflow: 'scroll'}}>
          <svg className={'feature-parallels-svg'} width={this.props.size[0]} height={570}>
            <g className={'feature-parallels'} transform={`translate(${this.state.margin.left},${this.state.margin.top})`} >
            <g className={'data-paths'}>
              {unDisplayExamples.map((ex) =>
                <path d={this.path(ex.data, this.state.yScalesDisplay)} fill={"none"}
                      stroke={'lightgray'} stroke-width={3}/>
              )}
            </g>
                <g className={'data-paths-foreground'}>
                    {displayExamples.map((ex) =>
                        <path d={this.path(ex.data, this.state.yScalesDisplay)} fill={"none"}
                              stroke={this.props.colorFunction(ex.target)} stroke-width={3}/>
                    )}
                </g>
            {this.props.features.map((feature, index) =>
                <Axis name={feature.name} textname={feature.name} axis={this.state.yScalesDisplay[feature.name]}
                      setFeatureDisplayRange={(e, r) => this.setFeatureDisplayRange(feature.index, feature.name, e, r)}
                      axisDisplay={this.state.yScalesAxesDisplay[feature.name]}
                      isNominal={feature.type == 'nominal'}
                      extent={this.state.extent[feature.name]}
                      height={this.state.height} transform={`translate(${this.props.xScale(feature.name)})`}/>
            )}
            </g>
          </svg>
        </div>
    )
  }
}
