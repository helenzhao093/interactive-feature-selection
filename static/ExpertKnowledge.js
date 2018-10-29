class ExpertKnowledge extends React.Component {
  constructor(props) {
    super(props)
    console.log(props.features)
    var radius = 16;
    const numberCircle = 2;
    const largeCircleRadius = Math.min(this.props.width, this.props.height)/2 - 2*radius;

    var circleRadii = []
    for (var i = numberCircle; i > 0; i--) {
      circleRadii.push(largeCircleRadius/numberCircle * i)
    }

    Object.keys(props.features).map(key =>
      {
          var pt_angle = Math.random() * 2 * Math.PI;
          var randomRadius;
          if (props.features[key].circleIndex == 0) {
            randomRadius = Math.random() * (circleRadii[props.features[key].circleIndex] - circleRadii[props.features[key].circleIndex + 1] - 2 * radius) + (circleRadii[props.features[key].circleIndex + 1] + radius);
          } else {
            randomRadius = Math.random() * (circleRadii[props.features[key].circleIndex] - radius);
          }
          var pt_radius_sq = randomRadius * randomRadius;
          props.features[key].radius = randomRadius;
          props.features[key].x = Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
          props.features[key].y = Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
      }
    )

    var colorFunction = d3.scaleOrdinal().range(['#e9f2fb', '#cfe1f2', '#a6cde4', '#7bb7d9', '#4694c7', '#2574b5', '#1059a1', '#083979']).domain([0,1,2,3,4,5,6,7])

    this.state = {
      features: this.props.features,
      featureRadius: radius,
      circleRadii: circleRadii,
      width: this.props.width,
      height: this.props.height,
      colorFunction: colorFunction,
      moves: [],
      step: 0
    };
    this.addCircle = this.addCircle.bind(this);
    this.calculateNewCircleRadius = this.calculateNewCircleRadius.bind(this);
    this.setPointPositions = this.setPointPositions.bind(this);
    this.undo = this.undo.bind(this);
  }

  componentDidMount() {
    var that = this
    d3.selectAll(".feature-node").call(d3.drag()
        .on("start", function(d) {
          //var circle = this.childNodes[0]
          d3.select(this).raise().classed("active", true);
          //d3.select(circle).attr("cx", d3.event.x).attr("cy", d3.event.y);
        })
        .on("drag", function(d) {
           d3.select(this).attr("transform", "translate(" + (this.x = d3.event.x) + "," + (this.y=d3.event.y) + ")");
           //var circle = this.childNodes[0]
           //var otherChild = this.childNodes[1]
           //d3.select(circle).attr("cx", d3.event.x).attr("cy", d3.event.y);
           //d3.select(child).attr("x", d3.event.x).attr("y", d3.event.y);
           //d3.select(otherChild).attr("cx", d3.event.x).attr("cy", d3.event.y);
           //d3.select(otherChild).attr("x", d3.event.x).attr("y", d3.event.y);
        })
        .on("end", function(d) {
          const x = that.state.features[this.id].x;
          const y = that.state.features[this.id].y;
          const currentRadius = that.state.features[this.id].radius
          const currentIndex = that.state.features[this.id].circleIndex
          that.state.features[this.id].x = d3.event.x;
          that.state.features[this.id].y = d3.event.y;
          const radius = Math.round(Math.sqrt(Math.pow(Math.abs(d3.event.x), 2) + Math.pow(Math.abs(d3.event.y), 2)))
          that.state.features[this.id].radius = radius

          if (radius > that.state.circleRadii[0] && that.state.features[this.id].circleIndex > -1 ) {
            that.state.features[this.id].circleIndex = -1;
            that.state.moves.push({type: "feature", id: this.id, position: {x: x, y: y }, radius: currentRadius, circleIndex: currentIndex})
            that.state.step = that.state.step + 1
            that.props.updateFeatureRank(this.id, that.state.circleRadii.length) // outside of circles
          }
          if (radius <= that.state.circleRadii[that.state.circleRadii.length - 1] - that.state.featureRadius && that.state.features[this.id].circleIndex != that.state.circleRadii.length - 1) { //smallest circle
            that.state.features[this.id].circleIndex = that.state.circleRadii.length - 1
            that.state.moves.push({type: "feature", id: this.id, position: {x: x, y: y }, radius: currentRadius, circleIndex: currentIndex})
            that.state.step = that.state.step + 1
            that.props.updateFeatureRank(this.id, 0)
          } else {
            for (var i = that.state.circleRadii.length - 2; i >= 0; i--) {
              //console.log(radius)
              //console.log(that.state.circleRadii[i])
              if (radius <= that.state.circleRadii[i] - that.state.featureRadius && radius >= that.state.circleRadii[i+1] && that.state.features[this.id].circleIndex != i) {
                that.state.features[this.id].circleIndex = i;
                that.state.moves.push({type: "feature", id: this.id, position: {x: x, y: y }, radius: currentRadius, circleIndex: currentIndex })
                that.state.step = that.state.step + 1
                that.props.updateFeatureRank(this.id, that.state.circleRadii.length - i - 1)
                break;
              }
            }
          }

          //console.log(that.state.features[circle.id])
          d3.select(this).classed("active", false);
        }));
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.circleRadii.length != this.state.circleRadii.length
  }

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
        this.state.features[featureId].circleIndex = lastStep.circleIndex
        this.state.features[featureId].radius = lastStep.radius
        this.state.features[featureId].x = lastStep.position.x
        this.state.features[featureId].y = lastStep.position.y
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
    this.state.moves.push({type: "circle", circleRadii: this.state.circleRadii, features: this.state.features})
    this.state.step = this.state.step + 1
    Object.keys(this.state.features).map((key) => {
      this.props.updateFeatureRank(key, this.state.circleRadii.length - this.state.features[key].circleIndex)
    });
    this.props.updateNumRanks(newCircleRadii.length);
    this.setState({
      circleRadii: newCircleRadii,
    })
  }

  setPointPositions(){
    //console.log(this.state.features)
    Object.keys(this.state.features).map(key =>
      {
        if (this.state.features[key].circleIndex != -1 &&
          (this.state.features[key].radius >= this.state.circleRadii[this.state.features[key].circleIndex] - this.state.featureRadius
            || this.state.features[key].radius <= this.state.circleRadii[this.state.features[key].circleIndex + 1])) {

            var pt_angle = Math.random() * 2 * Math.PI;
            var randomRadius = this.state.circleRadii.length > 1 ?
                              Math.random() * (this.state.circleRadii[this.state.features[key].circleIndex] - this.state.circleRadii[this.state.features[key].circleIndex + 1] - 2*this.state.featureRadius) + (this.state.circleRadii[this.state.features[key].circleIndex + 1] + this.state.featureRadius)
                              : Math.random() * (this.state.circleRadii[0] - this.state.featureRadius)
            var pt_radius_sq = randomRadius * randomRadius
            this.state.features[key].radius = randomRadius;
            this.state.features[key].x = Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
            this.state.features[key].y = Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
      }
    })
  }

  render(){
    console.log("render EK")
    this.setPointPositions()
    return (
      <div className={"column-left"} width={500} height={500}>
      <div width={"100%"} style={{"margin-left": 5}}>
        <button onClick={this.addCircle}>{"Add Layer"}</button>
        <button onClick={this.undo}>{"Undo"}</button>
      </div>
      <svg width={this.state.width} height={this.state.height}>
      <g id={"expert-knowledge"} transform={`translate(${this.state.width/2},${this.state.height/2})`} >
        {
          this.state.circleRadii.map((radius, index) =>
            <circle r={radius} fill={this.state.colorFunction(index)} stroke={"black"} stroke-width={2}/>
          )
        }
        {
          Object.keys(this.state.features).map((key, index) =>
            <g className={"feature-node"} id={key} transform={`translate(${this.state.features[key].x},${this.state.features[key].y})`}>
              <ellipse id={key} rx={this.state.featureRadius} ry={this.state.featureRadius} fill={"#b9d9ff"}/>
              <text id={key} y={4} textAnchor={"middle"}>{this.state.features[key].name}</text>
            </g>)
        }
      </g>
      </svg>
      </div>
    )
  }
}
