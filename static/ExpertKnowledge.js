class ContinuousLegend extends React.Component{
  constructor(props) {
    super(props)
      this.state = {
        width: 20,
          totalHeight: 240
      }
  }

  render() {
    var translate = (this.props.totalHeight - this.state.totalHeight)/2;
    var cellHeight = (this.state.totalHeight/this.props.colors.length);
    return (
      <g transform={`translate(5,${translate})`}>
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
    super(props)
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
    console.log(this.state)
    //this.addCircle = this.addCircle.bind(this);
    //this.calculateNewCircleRadius = this.calculateNewCircleRadius.bind(this);
    this.setPointPositions = this.setPointPositions.bind(this);
    this.undo = this.undo.bind(this);
  }

  componentDidMount() {
    var that = this;
    d3.selectAll(".feature-node").call(d3.drag()
        .on("start", function(d) {
          //var circle = this.childNodes[0]
          d3.select(this).raise().classed("active", true);
          //d3.select(circle).attr("cx", d3.event.x).attr("cy", d3.event.y);
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
              //console.log(radius)
              //console.log(that.props.circleRadii[i])
              if (radius <= that.props.circleRadii[i] - that.state.featureRadius && radius >= that.props.circleRadii[i+1] && that.props.features[this.id].circleIndex != i) {
                that.props.features[this.id].circleIndex = i;
                that.props.addMove({type: "feature", id: this.id, position: {x: x, y: y }, radius: currentRadius, circleIndex: currentIndex, newCircleIndex: i });
                that.state.step = that.state.step + 1
                that.props.updateFeatureRank(this.id, that.props.circleRadii.length - i - 1)
                break;
              }
            }
          }

          //console.log(that.state.features[circle.id])
          d3.select(this).classed("active", false);
        }));
  }

  //shouldComponentUpdate(nextProps, nextState) {
    //return nextProps.circleRadii.length != this.props.circleRadii.length
  //}

  componentDidUpdate() {
  }

  calculateNewCircleRadius(){
    //var lastRadius = this.state.circleRadii[this.state.circleRadii.length-1]
    //return this.state.circleRadii[0]/t
    const numberCircle = this.state.circleRadii.length + 1
    const largeCircleRadius = this.state.circleRadii[0]
    //var newCircleRadii = this.state.circleRadii.map((radius, index) =>
    //  largeCircleRadius/numberCircle * index
    var newCircleRadii = []
    for (var i = numberCircle; i > 0; i--) {
      newCircleRadii.push(largeCircleRadius/numberCircle * i)
    }
    return newCircleRadii
  }

  undo() {
    if (this.state.step > 0) {
      const lastStep = this.state.moves[this.state.step - 1]
      console.log(lastStep)
      if (lastStep.type == "feature"){
        const featureId = lastStep.id
        this.props.features[featureId].circleIndex = lastStep.circleIndex
        this.props.features[featureId].radius = lastStep.radius
        this.props.features[featureId].x = lastStep.position.x
        this.props.features[featureId].y = lastStep.position.y
        const selector = '[id=\"' + featureId + '"]'
        console.log(d3.select(selector).attr("transform", "translate(" + lastStep.position.x +  "," + lastStep.position.y + ")"))
        this.state.moves.splice(this.state.step - 1)
        this.state.step = this.state.step - 1

      } else {
        //  const features = lastStep.features;
        /*features.map((feature, index) => {
          const selector = '[id=\"' + index + '"]'
          //console.log(feature)
          //console.log(d3.select(selector).attr("transform", "translate(" + feature.x +  "," + feature.y + ")"))
          this.state.features[index].x = feature.x;
          this.state.features[index].y = feature.y;
          this.state.features[index].radius = feature.radius;
          this.state.features[index].circleIndex = feature.circleIndex;
          }
        )*/
        this.state.moves.splice(this.state.step - 1)
        this.state.step = this.state.step - 1
        this.setState({
          circleRadii: lastStep.circleRadii,
          //features: features
        })
      }

      console.log(this.state.moves)
      console.log(this.state.step)
    }
    // decrement step
  }

  addCircle() {
    //const lastRadius = this.state.circleRadii[this.state.circleRadii.length-1]
    //const newRadius = this.calculateNewCircleRadius()
    //const currentCircleRadii = this.state.circleRadii
    const newCircleRadii = this.calculateNewCircleRadius()//currentCircleRadii.concat(newRadius)
    console.log(newCircleRadii)
    this.props.moves.push({type: "circle", circleRadii: this.props.circleRadii, features: this.props.features})
    this.props.step = this.props.step + 1
    Object.keys(this.props.features).map((key) => {
      this.props.updateFeatureRank(key, this.state.circleRadii.length - this.props.features[key].circleIndex)
    });
    this.props.updateNumRanks(newCircleRadii.length);
    this.setState({
      circleRadii: newCircleRadii,
    })
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
        <button onClick={this.props.addCircle}>{"Add Layer"}</button>
        <button onClick={this.props.undo}>{"Undo"}</button>
          <button className={"tools-bar right-button"} onClick={this.props.nextStep}>{"Next"}</button>
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
