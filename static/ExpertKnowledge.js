class ContinuousLegend extends React.Component{
  constructor(props) {
    super(props);
      this.state = {
        width: 20,
          totalHeight: 240
      }
  }

  render() {
    var translate = (this.props.totalHeight - this.state.totalHeight)/2;
    var cellHeight = (this.state.totalHeight/this.props.colors.length);
    return (
      <g transform={`translate(20,${translate})`}>
          <text y={-25}>{"Importance"}</text>
          <text y={-5}>{"Most"}</text>
          {
            this.props.colors.map((color, index) =>
                <g className={"legend-cell"} transform={`translate(0,${index * cellHeight})`}>
                  <rect height={cellHeight} width={this.state.width} stroke={"black"} strokeWidth={1} fill={color}></rect>
                </g>
            )}
            <text y={255}>{"Least"}</text>
          </g>
  )}
}
//                   <text x={30} y={20} textAnchor={"middle"}>{index}</text>

class ExpertKnowledge extends React.Component {
  constructor(props) {
    super(props);
    console.log(props.features);
    var radius = 16;
    var colorRange = ['#e9f2fb', '#cfe1f2', '#a6cde4', '#7bb7d9', '#4694c7', '#2574b5', '#1059a1', '#083979'];
    var colorFunction = d3.scaleOrdinal().range(colorRange).domain([0,1,2,3,4,5,6,7])

    this.state = {
      featureRadius: radius,
      width: this.props.width,
      height: this.props.height,
      colorRange: colorRange,
      colorFunction: colorFunction,
    };
    console.log(this.state);
    this.setPointPositions = this.setPointPositions.bind(this);
  }

  componentDidMount() {
    var that = this;
    d3.selectAll(".feature-node").call(d3.drag()
        .on("start", function(d) {
          d3.select(this).raise().classed("active", true);
        })
        .on("drag", function(d) {
           d3.select(this).attr("transform", "translate(" + (this.x = d3.event.x) + "," + (this.y=d3.event.y) + ")");
        })
        .on("end", function(d) {
          const x = that.props.features[this.id].x;
          const y = that.props.features[this.id].y;
          const currentRadius = that.props.features[this.id].radius
          const currentIndex = that.props.features[this.id].circleIndex
          that.props.features[this.id].x = d3.event.x;
          that.props.features[this.id].y = d3.event.y;
          const radius = Math.round(Math.sqrt(Math.pow(Math.abs(d3.event.x), 2) + Math.pow(Math.abs(d3.event.y), 2)))
          that.props.features[this.id].radius = radius

          if (radius > that.props.circleRadii[0] && that.props.features[this.id].circleIndex > -1 ) {
            that.props.features[this.id].circleIndex = -1;
            that.props.addMove({type: "feature", id: this.id, position: {x: x, y: y }, radius: currentRadius, circleIndex: currentIndex, newCircleIndex: -1 });
            that.state.step = that.state.step + 1
            that.props.updateFeatureRank(this.id, that.props.circleRadii.length) // outside of circles
          }
          if (radius <= that.props.circleRadii[that.props.circleRadii.length - 1] - that.state.featureRadius && that.props.features[this.id].circleIndex != that.props.circleRadii.length - 1) { //smallest circle
            that.props.features[this.id].circleIndex = that.props.circleRadii.length - 1;
            that.props.addMove({type: "feature", id: this.id, position: {x: x, y: y }, radius: currentRadius, circleIndex: currentIndex, newCircleIndex: that.props.circleRadii.length - 1});
            that.state.step = that.state.step + 1
            that.props.updateFeatureRank(this.id, 0)
          } else {
            for (var i = that.props.circleRadii.length - 2; i >= 0; i--) {
              if (radius <= that.props.circleRadii[i] - that.state.featureRadius && radius >= that.props.circleRadii[i+1] && that.props.features[this.id].circleIndex != i) {
                that.props.features[this.id].circleIndex = i;
                that.props.addMove({type: "feature", id: this.id, position: {x: x, y: y }, radius: currentRadius, circleIndex: currentIndex, newCircleIndex: i });
                that.state.step = that.state.step + 1
                that.props.updateFeatureRank(this.id, that.props.circleRadii.length - i - 1)
                break;
              }
            }
          }
          d3.select(this).classed("active", false);
        }));
  }

  setPointPositions(){
    //console.log(this.state.features)
    Object.keys(this.props.features).map(key =>
      {
        if (this.props.features[key].circleIndex != -1 &&
          (this.props.features[key].radius >= this.props.circleRadii[this.props.features[key].circleIndex] - this.state.featureRadius
            || this.props.features[key].radius <= this.props.circleRadii[this.props.features[key].circleIndex + 1])) {

            var pt_angle = Math.random() * 2 * Math.PI;
            var randomRadius = this.props.circleRadii.length > 1 ?
                              Math.random() * (this.props.circleRadii[this.props.features[key].circleIndex] - this.props.circleRadii[this.props.features[key].circleIndex + 1] - 2*this.state.featureRadius) + (this.props.circleRadii[this.props.features[key].circleIndex + 1] + this.state.featureRadius)
                              : Math.random() * (this.props.circleRadii[0] - this.state.featureRadius)
            var pt_radius_sq = randomRadius * randomRadius
            this.props.features[key].radius = randomRadius;
            this.props.features[key].x = Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
            this.props.features[key].y = Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
      }
    })
  }

  render(){
    console.log("render EK");
    this.setPointPositions();
    var colors = [];
    var numColors = 0;
    var colorIndex = 0;
    while (numColors < this.props.circleRadii.length) {
      colors.unshift(this.state.colorRange[colorIndex]);
      colorIndex = colorIndex + 1;
      numColors = numColors + 1;
    }
    return (
      <div>
      <div width={"100%"} className={"tools-bar"}>
        <button className={"tools-bar action-button"} onClick={this.props.addCircle}>{"Add Layer"}</button>
          <div className={"tools-bar-help"}>?
              <span className={"tools-bar-help-text"}>
                      {"Add an innermost circle representing features of most importance."}
                  </span>
          </div>
        <button className={"tools-bar action-button"} onClick={this.props.undo}>{"Undo"}</button>
          <button className={"tools-bar right-button next-button"} onClick={this.props.nextStep}>{"NEXT »"}</button>
      </div>
      <svg width={this.state.width} height={this.state.height} style={{display: "block", margin: "auto"}}>
      <g id={"expert-knowledge"} transform={`translate(${this.state.width/2},${this.state.height/2 })`} >
        {
          this.props.circleRadii.map((radius, index) =>
            <circle r={radius} fill={this.state.colorFunction(index)} stroke={"black"} stroke-width={2}/>
          )
        }
        {
          Object.keys(this.props.features).map((key, index) =>
            <g className={"feature-node"} id={key} transform={`translate(${this.props.features[key].x},${this.props.features[key].y})`}>
              <ellipse id={key} rx={this.state.featureRadius} ry={this.state.featureRadius} fill={"#b9d9ff"}/>
              <text id={key} y={4} textAnchor={"middle"}>{this.props.features[key].name}</text>
            </g>)
        }
      </g>
          <ContinuousLegend totalHeight={this.state.height} colors={colors}/>
      </svg>
      </div>
    )
  }
}
