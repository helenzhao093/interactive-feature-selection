/*** @jsx React.DOM */
class Interface extends React.Component {
  constructor(props) {
    super(props)
    //var brush = d3.brushY().extent([[0, 0], [300, 265]])//.on("end", zoom);
    this.state = {
      histogramTotalWidth: 300,
      histogramTotalHeight: 300,
      data:this.props.data,
      margin: { top: 5, right: 0, bottom: 15, left: 0 }
    }

    //var brush = d3.brushY().extent([[0, this.state.margin.top],
    //  [this.state.histogramTotalWidth, this.state.histogramTotalHeight - this.state.margin.bottom]])//.on("end", zoom);
    //this.setState({brush: brush})
    this.calculateNewRange = this.calculateNewRange.bind(this)
    this.zoom = this.zoom.bind(this)
  }

  componentDidMount() {

  }

  componentDidUpdate() {

  }

  calculateNewRange(brushY) {
    return brushY/(this.state.histogramTotalHeight - this.state.margin.top - this.state.margin.bottom)
    * (this.props.data.range[1] - this.props.data.range[0]) + this.props.data.range[0];
  }

  zoom() {
    //console.log(d3.event.selection)

    var new_range = d3.event.selection.map((data) => this.calculateNewRange(data))
    fetch('/postHistogramZoom', {
      method: 'POST',
      body: JSON.stringify({ "selection": new_range})
    }).then(function(response) {
      return response.json();
    }).then(data =>
      this.setState({data: data})
    ).catch(function(error) {
      console.log(error)
    })
    //d3.event.target.move([0, 0], [300, 300])
    console.log(d3.selectAll(".selection").attr("width", 0))
  }


  // sends to zoom in

  render() {
    console.log('render interface')

    //var width = this.state.data.histogramTotalWidth
    //var brushHeight = this.state.data.histogramTotalHeight - 35

    // FIX: zoom method should zoom in the brushed view
    /*function zoom() {
      console.log(d3.event.selection)

      var new_range = d3.event.selection.map((data) => this.calculateNewRange(data))

      fetch('/postHistogramZoom', {
        method: 'POST',
        body: JSON.stringify({ "selection": new_range})
      }).then(function(response) {
        return response.json();
      }).then(function(json) {
        console.log(json)
      }).catch(function(error) {
        console.log(error)
      })
    }*/
    var brush = d3.brushY().extent([[0, this.state.margin.top],
      [this.state.histogramTotalWidth, this.state.histogramTotalHeight - this.state.margin.bottom]])
    //console.log(brush)
    brush.on("end", this.zoom)
    console.log(brush)
    var histograms = this.state.data.histogramData.map((data, index) =>
      <Histogram data={data} max={this.props.data.range[1]} min={this.props.data.range[0]}
        size={[this.state.histogramTotalWidth, this.state.histogramTotalHeight]} margin={this.state.margin}
        maxNeg={this.state.data.maxNeg} maxPos={this.state.data.maxPos} brush={brush} index={index} />
    )
    return (
      <div className="histograms">{histograms}</div>
    )
  }
}
