class Legend extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {

  }

  componentDidUpdate() {

  }

  render() {
    //console.log(this.props)
    return (
      <div className={this.props.className}>
      {this.props.keys.map((key, index) =>
        <div width={50}>
          <div className={"series-marker"}  style={{background: this.props.colors[index]}}></div>
          <p>{key}</p>
        </div>
      )}
      </div>
    )
  }
}

class LineAxis extends React.Component {
 constructor(props) {
   console.log(props)
   super(props)
 }

 componentDidMount() {
   var className = '.' + this.props.name
   d3.selectAll(className).call(this.props.axis)
 }

 componentDidUpdate() {
   //console.log('update axis')
   var className = '.' + this.props.name;
   d3.selectAll(className).call(this.props.axis)
 }

 render() {
   //console.log('render axis')
   return(
     <g className={this.props.name} transform={`translate(0,${this.props.top})`} style={{fontSize: 11, fontFamily: "san-serif"}}/>
   )
 }
}

class ProgressGraph extends React.Component {
  constructor(props) {
    console.log(props)
    super(props)
    // array of consistency MB scores
    // array of consistency EK scores
    // array of MI scores
    var margin = {left: 30, right: 30, top: 20, bottom: 30};
    var width = props.size[0] - margin.left - margin.right;
    var height = props.size[1] - margin.top - margin.bottom;
    this.state = {
      margin: margin,
      width: width,
      height: height,
      min: 0.0,
      max: 1.0,
      keys: Object.keys(this.props.consistencyScores)
    };
    this.initializeMinMax = this.initializeMinMax.bind(this);
    this.getDataPoints = this.getDataPoints.bind(this);
    this.getLineDrawFunction = this.getLineDrawFunction.bind(this);
    this.getXAxis = this.getXAxis.bind(this);
    this.combinePastScoresAndCurrentScores = this.combinePastScoresAndCurrentScores.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  componentDidMount() {
    var that = this;
    var id = '#progress-graph-' + this.props.name;
    d3.select(id)
      .on("mousemove", function(d) {
        var xPosition = d3.mouse(this)[0] - that.state.margin.left;
        var keys = Object.keys(that.props.consistencyScores);
        //console.log(keys)
        var numDataPoints;
        if (that.props.currentScores) {
          if (that.props.currentScores[keys[0]] >= 0) {
            numDataPoints = that.props.consistencyScores[keys[0]].length + 1
          } else {
            numDataPoints = that.props.consistencyScores[keys[0]].length
          }
        } else{
          numDataPoints = that.props.consistencyScores[keys[0]].length
        }

        //}? that.props.consistencyScores[keys[0]].length + 1 : that.props.consistencyScores[keys[0]].length
        //console.log(that.props.currentScores)
        //console.log(numDataPoints)
        var range = (that.props.size[0] - that.state.margin.left - that.state.margin.right) / (that.props.xAxisLength - 1)
        //console.log(xPosition)
        //console.log(range)
        var mouseIndex = ((Math.ceil(xPosition/range) - xPosition/range) < 0.5) ? Math.ceil(xPosition/range) : Math.floor(xPosition/range)

        if (mouseIndex != that.props.selectedIndex && numDataPoints > 1) {
          that.props.updateIndex(mouseIndex)
          /*that.setState({
            selectedIndex: mouseIndex
          })*/
        }
      })
      .on("mousedown", function(d) {
        console.log(that.props.selectedIndex)
        that.props.goToStep(that.props.selectedIndex)
      })
  }

  componentDidUpdate() {
  }

  initializeMinMax(scores) {
    var keys = this.state.keys;
    if (scores[keys[0]].length == 0) {
      this.state.max = 1;
      this.state.min = 0;
    } else {
      var max;
      var min;
      keys.map(key =>
          {
            max = scores[key].reduce(function(a, b) {
              return Math.max(a,b)
            });
            min = scores[key].reduce(function (a, b) {
              return Math.min(a, b)
            });
            if (min < this.state.min) {
              this.state.min = min
            }
            if (max > this.state.max) {
              this.state.max = max
            }
          }
      )
    }
   /* if (scores.length > 0) {
        var max = scores.reduce(function (a, b) {
            return Math.max(a, b)
        });
        var min = scores.reduce(function (a, b) {
            return Math.min(a, b)
        });
        if (min < this.state.min) {
            this.state.min = min
        }
        if (max > this.state.max) {
            this.state.max = max
        }
    } */
  }

  getDataPoints(scores) {
    var keys = this.state.keys;
    var lineDataPoints = [];
    if (scores[keys[0]].length > 0) {
      lineDataPoints = keys.map((key) =>
            scores[key].map((d, index) => [index, d])//this.getData(scores[key])
      );
    }
    return lineDataPoints; //data.map((d, index) => [index, d])
  }

  onMouseEnter() {
    //d3.select(".focus").attr("display", "block")
  }

  onMouseLeave() {
    //d3.select(".focus").attr("display", "none")
  }

  combinePastScoresAndCurrentScores() {
      var scores = {};
      var keys = Object.keys(this.props.consistencyScores);
      keys.forEach((key) => {
          scores[key] = this.props.consistencyScores[key].slice()
      });
      if (this.props.currentScores[keys[0]] >= 0) {
        keys.map((key) => {
          scores[key].push(this.props.currentScores[key])
        })
      }
      return scores;
  }

  getXAxis() {
      var xScaleDomain = [];
      var xScaleRange = [];
      for (var i = 0; i < this.props.xAxisLength; i++) {
          xScaleDomain.push(i);
          //xScaleRange.push( this.state.width/(this.props.xAxisLength - 1) * i );
      }
      var xScale = d3.scaleBand().domain(xScaleDomain).range([0, this.state.width]).padding(0.1);
      return xScale;
  }

  getLineDrawFunction(scores, xScale, yScale) {
    console.log(xScale);
    var keys = Object.keys(this.props.consistencyScores);
    if (scores[keys[0]].length > 0) {
      return d3.line().x(function(d) {return xScale(d[0]) + xScale.bandwidth() * 0.5 }).y(function(d) { return yScale(d[1])});
    } else {
      return null;
    }
  }

  render(){
    console.log("progress graph");
    console.log(this.props);
    var scores = this.combinePastScoresAndCurrentScores();
    var keys = this.state.keys;

    var xScale = this.getXAxis();
    //console.log(xScale.bandwidth);
    //this.initializeMinMax(scores);

    var yScale = d3.scaleLinear().domain([this.props.max, this.props.min]).nice()
        .range([0, this.state.height]);
    var draw = this.getLineDrawFunction(scores, xScale, yScale); //d3.line().x(function(d) {return xScale(d[0])}).y(function(d) { return yScale(d[1])})

    var lineDataPoints = this.getDataPoints(scores);
    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);
    //console.log(xAxis)
    //var datapoints = [this.props.consistencyEK, this.props.consistencyMB, this.props.MI]
    //console.log(lineDataPoints)


    var focus;
    if (scores[keys[0]].length > 0) {
      focus = keys.map((key, index) =>
          <g transform={`translate(${xScale(this.props.selectedIndex) + xScale.bandwidth() * 0.5},${yScale(scores[key][this.props.selectedIndex])})`}>
              <circle r={5} fill={this.props.colors[index]}/>
              <text x={9}>{scores[key][this.props.selectedIndex]}</text>
          </g>);
    } else {
      focus = <div></div>;
    }

    var displayPoints = keys.map((key, index1) =>
      scores[key].map((score, index2) =>
          <circle r={5} fill={this.props.colors[index1]} cx={xScale(index2) + xScale.bandwidth() * 0.5} cy={yScale(score)}/>
      )
    );
    /*var displayPointsMB = scores.MB.map((score, index) =>
        <circle r={5} fill={this.props.colors[0]} cx={xScale(index) + xScale.bandwidth() * 0.5} cy={yScale(score)}/>
    );
    var displayPointsMI = scores.MI.map((score, index) =>
        <circle r={5} fill={this.props.colors[1]} cx={xScale(index) + xScale.bandwidth() * 0.5} cy={yScale(score)}/>
    )

      <g className={"points"}>
                {displayPointsMB}
                {displayPointsMI}
            </g>
            */

    var precisionBarOffset = xScale.bandwidth() * 0.15;
    var precisionBarWidth = xScale.bandwidth() * 0.7;
    return (
      <svg id={"progress-graph-" + this.props.name} width={this.props.size[0]} height={this.props.size[1]}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}>
          <text>{"Title"}</text>
        <g className={"score-paths"} transform={`translate(${this.state.margin.left},${this.state.margin.top})`}>
          <LineAxis name={"progress-x-axis-" + this.props.name} axis={xAxis} top={this.state.height}/>
          <LineAxis name={"progress-y-axis-" + this.props.name} axis={yAxis} top={0}/>

          {
            this.props.metrics.accuracy.map((value, index) =>
              <rect x={xScale(index)} y={yScale(value)} height={yScale(0) - yScale(value)} width={xScale.bandwidth()} fill={this.props.metricsColors[0]}></rect>
            )
          }
          {
            this.props.metrics.precision.map((value, index) =>
              <rect x={xScale(index) + precisionBarOffset} y={yScale(value)} height={yScale(0) - yScale(value)} width={precisionBarWidth} fill={this.props.metricsColors[1]}></rect>
            )
          }
          {
            lineDataPoints.map((points, index) =>
                <path className={"graphline"} d={draw(points)} stroke={this.props.colors[index]} stroke-width={3} fill={"none"} />
            )
          }
          <g className={"points"}>
              {displayPoints}
              </g>
          <g className={"focus"} style={{fontSize: 11, fontFamily: "san-serif"}}>
            {focus}
          </g>
        </g>
      </svg>
    )
  }
}

/*
<path className={"graphline"} d={draw(EKdata)} stroke={"red"} stroke-width={3} fill={"none"}/>
<path className={"graphline"} d={draw(MBdata)} stroke={"green"} stroke-width={3} fill={"none"}/>
<path className={"graphline"} d={draw(MIdata)} stroke={"blue"} stroke-width={3} fill={"none"}/>
*/
