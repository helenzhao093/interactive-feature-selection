/*** @jsx React.DOM */
import React from "react";
import ReactDOM from "react-dom";
import { VerticalHistogram } from "./VerticalHistogram"
import Histogram from "./Histogram"
import FeatureParallelCoordinates from "./FeatureParallelCoordinates"
import Settings from "./Settings"
import FeatureHistogram from "./FeatureHistogram"


class ZoomButton extends React.Component{
  constructor(props) {
    super(props)
    this.state = { zoomOn: false, background: "white" }
    this.onClick = this.onClick.bind(this)
    this.turnOnZoom = this.turnOnZoom.bind(this)
    this.turnOffZoom = this.turnOffZoom.bind(this)
  }

  componentDidMount() {
    d3.selectAll(".brush").call(this.props.brush)
    this.turnOffZoom()
  }

  turnOnZoom() {
    var brushGroup = document.getElementsByClassName("brush");
    for (var i = brushGroup.length - 1; i >= 0; i--) {
      var brushChildNodes = brushGroup[i].childNodes
      brushChildNodes[0].style.display = "block"
      for (var j = brushChildNodes.length - 1; j > 0; j--) {
        brushChildNodes[j].style.display = "none";
      }
    }
  }

  turnOffZoom() {
    var brushGroup = document.getElementsByClassName("brush");
    for (var i = brushGroup.length - 1; i >= 0; i--) {
      var brushChildNodes = brushGroup[i].childNodes
      for (var j = brushChildNodes.length - 1; j >= 0; j--) {
        brushChildNodes[j].style.display = "none";
      }
    }
  }

  componentDidUpdate() {
    if (this.state.zoomOn){
      this.turnOnZoom()
    } else {
      this.turnOffZoom()
    }
  }

  onClick() {
    var background = this.state.zoomOn ? "white" : "turquoise"
    console.log(background)
    this.setState({ zoomOn: !this.state.zoomOn, background: background})

    //d3.selectAll(".brush").call(this.props.brush)
    //d3.selectAll(".selection").attr("width", 0)
    //console.log(this.state)
  }

  render(){
    return (
      <button onClick={this.onClick} style={{background:this.state.background}}>{"Zoom"}</button>
    )
  }
}

export class Interface extends React.Component {
  constructor(props) {
    console.log(props)
    super(props)
    //var brush = d3.brushY().extent([[0, 0], [300, 265]])//.on("end", zoom);

    var colorRange = ["#00649b", "#bc4577", "#ff7e5a", "#b2bae4", "#c0392b", "#f1c40f", "#16a085", "#3498db" ]
    var color = d3.scaleOrdinal()
        .range(colorRange)
        .domain(props.data.classNames) //TODO: LET USERS SET CLASS NAMES

    // SUMMARY HISTOGRAM INFO
    var summaryHistogram = {}
    summaryHistogram.margin = {top: 5, right: 5, bottom: 30, left: 30}
    summaryHistogram.size = [300, 300]

    summaryHistogram.domain = props.summaryData.data.map((data, index) => index )
    summaryHistogram.yScale = d3.scaleLinear()
        .domain([0, props.summaryData.maxClassTotal])
        .rangeRound([0, summaryHistogram.size[1] - summaryHistogram.margin.top - summaryHistogram.margin.bottom])

    summaryHistogram.yScaleAxis = d3.scaleLinear()
        .domain([props.summaryData.maxClassTotal, 0])
        .rangeRound([0, summaryHistogram.size[1] - summaryHistogram.margin.top - summaryHistogram.margin.bottom])

    summaryHistogram.xScale = d3.scaleBand()
        .domain(summaryHistogram.domain)
        .rangeRound([0, summaryHistogram.size[0] - summaryHistogram.margin.left - summaryHistogram.margin.right]).padding(0.3)

    summaryHistogram.xAxis = d3.axisBottom(summaryHistogram.xScale)
    summaryHistogram.yAxis = d3.axisLeft(summaryHistogram.yScaleAxis)
    summaryHistogram.name = "summary"
    console.log(summaryHistogram)

    this.state = {
      colorRange: colorRange,
      colorFunction: color,
      histogramTotalWidth: 300,
      histogramTotalHeight: 300,
      margin: {top: 5, right: 5, bottom: 15, left: 0},
      data:this.props.data,
      featureData:this.props.featureData,
      summaryData: this.props.summaryData,
      summaryHistogram: summaryHistogram,
      featureDistribution: this.props.featureDistribution,
      histogramHistory: [{ data: this.props.data }],
      histogramUpdateStep: 0
    }
    //var brush = d3.brushY().extent([[0, this.state.margin.top],
    //  [this.state.histogramTotalWidth, this.state.histogramTotalHeight - this.state.margin.bottom]])//.on("end", zoom);
    //this.setState({brush: brush})
    this.calculateNewRange = this.calculateNewRange.bind(this)
    this.zoom = this.zoom.bind(this)
    this.sendData = this.sendData.bind(this)
    this.onClick = this.onClick.bind(this)
    this.updateData = this.updateData.bind(this)
    this.undo = this.undo.bind(this)
    this.clear = this.clear.bind(this)
    this.classSelected = this.classSelected.bind(this)
    this.getData = this.getData.bind(this)
  }

  componentDidMount() {

  }

  componentDidUpdate() {

  }

  calculateNewRange(brushY) {
    return brushY/(this.state.histogramTotalHeight - this.state.margin.top - this.state.margin.bottom) * (this.props.data.range[1] - this.props.data.range[0]) + this.props.data.range[0];
  }

  onClick(classification, display) {
    this.sendData('/postHistogramDisplay',
      { "classification": classification,
        "display": display}
    )
  }

  zoom() {
    //console.log(d3.event.selection)
    var newRange = d3.event.selection.map((data) => this.calculateNewRange(data))
    this.sendData('/postHistogramZoom', { "selection": newRange })
  }

  sendData(url, dataToSend) {
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(dataToSend)
    }).then(function(response) {
      return response.json();
    }).then(data =>
      //console.log(data)
      this.updateData(data)
    ).catch(function(error) {
      console.log(error)
    })
  }

  getData(url){
    fetch(url, {
      method: 'GET',
    }).then(function(response) {
      return response.json();
    }).then(data =>
      console.log(data)
    ).catch(function(error) {
      console.log(error)
    })
  }

  updateData(data) {
    const currentHistory = this.state.histogramHistory.splice(0, this.state.histogramUpdateStep + 1)
    this.setState({
      //data: data,
      histogramHistory: currentHistory.concat([ { data: data.histogramData } ]),
      histogramUpdateStep: currentHistory.length,
      featureData: data.featureData,
      featureDistribution: data.featureDistribution,
    })

  }

  undo() {
    if (this.state.histogramUpdateStep > 0) {
      this.setState({
        histogramUpdateStep: this.state.histogramUpdateStep - 1
      })
    }
  }

  clear() {
    this.setState({
      histogramUpdateStep: 0
    })
  }

  classSelected(className, currentDisplay){
    console.log(className, currentDisplay)
    this.sendData("/classSelected", { "className": className, "currentDisplay" : currentDisplay } )
  }

  render() {
    console.log('render interface')
    this.getData('/calculate')
    var brush = d3.brushY().extent([[0, this.state.margin.top],
      [this.state.histogramTotalWidth, this.state.histogramTotalHeight - this.state.margin.bottom]])
    //console.log(brush)
    brush.on("end", this.zoom)
    //console.log(brush)

    const currentHistogramData = this.state.histogramHistory[this.state.histogramUpdateStep]
    /*var histograms = this.state.data.histogramData.map((data, index) =>
      <Histogram data={data} max={this.props.data.range[0]} min={this.props.data.range[1]}
        size={[this.state.histogramTotalWidth, this.state.histogramTotalHeight]} margin={this.state.margin}
        maxNeg={this.state.data.maxNeg} maxPos={this.state.data.maxPos} brush={brush} index={index} />
    )*/

    console.log(currentHistogramData)

    return (
      <div className={"interface"}>

        {Object.keys(this.state.featureData.classDisplay).map((className) =>
          <button className={className + 'button'} onClick={() => this.classSelected(className, this.state.featureData.classDisplay[className].TP.display)}>
            {className}
          </button>
         )}

        {this.state.featureDistribution.map((feature, index) =>
          <FeatureHistogram
            data={feature.data}
            numBins={feature.data.length}
            size={[300,200]}
            featureName={this.state.featureData.features[index].featureName}
            featureRange={this.state.featureData.features[index].range}
            colorFunction={this.state.colorFunction}
            margin={this.state.summaryHistogram.margin}
            max={feature.max}
            />
        )}
        <FeatureParallelCoordinates data={this.state.featureData.data}
          features={this.state.featureData.features}
          size={[1000,400]}
          colorFunction={this.state.colorFunction} />

        <Settings display={currentHistogramData.data.display} onClick={(c, d) => this.onClick(c, d)}/>
        <ZoomButton brush={brush} />
        <button onClick={this.undo}>{"Undo"}</button>
        <button onClick={this.clear}>{"Clear"}</button>
        <div className={"histograms"}>
          {currentHistogramData.data.HistogramData.map((data, index) =>
            <Histogram data={data} max={currentHistogramData.data.range[0]} min={currentHistogramData.data.range[1]}
              size={[this.state.histogramTotalWidth, this.state.histogramTotalHeight]} margin={this.state.margin}
              maxNeg={currentHistogramData.data.maxNeg} maxPos={currentHistogramData.data.maxPos}
              brush={brush} index={index}
              colorRange={this.state.colorRange}
              colorFunction={this.state.colorFunction}
              index={index}
              />
            )
          }
        </div>
      </div>
    )
  }
}
/*
<VerticalHistogram
  data={this.state.summaryData.data}
  max={this.state.summaryData.maxClassTotal}
  colorFunction={this.state.colorFunction}
  size={this.state.summaryHistogram.size}
  margin={this.state.summaryHistogram.margin}
  xScale={this.state.summaryHistogram.xScale}
  yScale={this.state.summaryHistogram.yScale}
  yScaleAxis={this.state.summaryHistogram.yScaleAxis}
  yAxis={this.state.summaryHistogram.yAxis}
  xAxis={this.state.summaryHistogram.xAxis}
  name={this.state.summaryHistogram.name}
  domain={this.state.summaryHistogram.domain}
  />
*/