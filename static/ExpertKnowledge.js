class ExpertKnowledge extends React.Component {
  constructor(props) {
    super(props)
    var radius = 16
    var circleRadii = [Math.min(this.props.width, this.props.height)/2 - 2*radius]
    this.props.featureSchema.map(schema =>
      {
        schema.circleIndex = 0
        var pt_angle = Math.random() * 2 * Math.PI;
        var randomRadius = Math.random() * (circleRadii[0] - radius)
        var pt_radius_sq = randomRadius * randomRadius
        schema.radius = randomRadius;
        schema.x = Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
        schema.y = Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
      }
    )
    this.state = {
      features: this.props.featureSchema,
      featureRadius: radius,
      circleRadii: circleRadii,
      width: this.props.width,
      height: this.props.height
    }
    this.addCircle = this.addCircle.bind(this)
    this.calculateNewCircleRadius = this.calculateNewCircleRadius.bind(this)
    this.setPointPositions = this.setPointPositions.bind(this)
    console.log(this.state)
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
          that.state.features[this.id].x = d3.event.x;
          that.state.features[this.id].y = d3.event.y;
          const radius = Math.round(Math.sqrt(Math.pow(Math.abs(d3.event.x), 2) + Math.pow(Math.abs(d3.event.y), 2)))
          that.state.features[this.id].radius = radius

          if (radius <= that.state.circleRadii[that.state.circleRadii.length - 1] - that.state.featureRadius) {
            that.state.features[this.id].circleIndex = that.state.circleRadii.length - 1
          } else {
            for (var i = that.state.circleRadii.length - 2; i >= 0; i--) {
              console.log(radius)
              console.log(that.state.circleRadii[i])

              if (radius <= that.state.circleRadii[i] - that.state.featureRadius && radius >= that.state.circleRadii[i+1] ) {
                that.state.features[this.id].circleIndex = i;
                break;
              }
            }
          }

          //console.log(that.state.features[circle.id])
          d3.select(this).classed("active", false);
        }));
  }

  componentDidUpdate() {
  }

  /*randomPointInCircle(radius) {

    return [pt_x, pt_y]
  }*/

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

  addCircle() {
    //const lastRadius = this.state.circleRadii[this.state.circleRadii.length-1]
    //const newRadius = this.calculateNewCircleRadius()
    //const currentCircleRadii = this.state.circleRadii
    const newCircleRadii = this.calculateNewCircleRadius()//currentCircleRadii.concat(newRadius)
    console.log(newCircleRadii)
    this.setState({
      circleRadii: newCircleRadii,
    })
  }

  setPointPositions(){
    console.log(this.state.features)
    this.state.features.map(schema =>
      {
        if (schema.radius >= this.state.circleRadii[schema.circleIndex] - this.state.featureRadius || schema.radius <= this.state.circleRadii[schema.circleIndex + 1]) {
          var pt_angle = Math.random() * 2 * Math.PI;
          var randomRadius = this.state.circleRadii.length > 1 ?
                              Math.random() * (this.state.circleRadii[schema.circleIndex] - this.state.circleRadii[schema.circleIndex + 1] - 2*this.state.featureRadius) + (this.state.circleRadii[schema.circleIndex + 1] + this.state.featureRadius)
                              : Math.random() * (this.state.circleRadii[0] - this.state.featureRadius)
          var pt_radius_sq = randomRadius * randomRadius
          schema.radius = randomRadius;
          schema.x = Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
          schema.y = Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
      }
    })
  }

  render(){
    this.setPointPositions()
    return (
      <div>
      <button onClick={this.addCircle}>{"Add Layer"}</button>
      <svg width={this.state.width} height={this.state.height}>
      <g transform={`translate(${this.state.width/2},${this.state.height/2})`} >
        {
          this.state.circleRadii.map(radius =>
            <circle r={radius} fill={"none"} stroke={"black"} stroke-width={2}/>
          )
        }
        {
          this.state.features.map((feature, index) =>
            <g className={"feature-node"} id={index} transform={`translate(${feature.x},${feature.y})`}>
              <circle id={index} r={this.state.featureRadius} fill={"blue"}/>
              <text id={index} textAnchor={"middle"}>{feature.name}</text>
            </g>)
        }
      </g>
      </svg>
      </div>
    )
  }
}
