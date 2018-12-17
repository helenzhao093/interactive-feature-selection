function VerticalLegend(props) {
    return(
        <div className={"legend legend-left"} style={(props.style) ? props.style : {}}>
            {props.legend.map((item) =>
                <div style={{padding: "1px", width: props.width ? props.width : 100, marginLeft: (props.marginLeft) ? props.marginLeft : "20px"}}>
                    <div className={"series-marker"} style={{background: item.color}}></div>
                    <p>{item.value}</p>
                    <div className={"tools-bar-help legend-help"}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        <span className={"tools-bar-help-text legend-helptext"}>
                                    {item.helptext}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

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
          <div className={"series-marker"} style={{background: this.props.colors[index]}}></div>
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
   return(
     <g className={this.props.name} transform={`translate(0,${this.props.top})`} style={{fontSize: 11, fontFamily: "san-serif"}}/>
   )
 }
}

class BarGraph extends React.Component {
    constructor(props) {
        super(props);
        var margin = {left: 30, right: 30, top: 20, bottom: 30};
        var width = props.size[0] - margin.left - margin.right;
        var height = props.size[1] - margin.top - margin.bottom;
        this.state = {
            margin: margin,
            width: width,
            height: height,
            min: 0.0,
            max: 1.0
        }
    }

    render() {
        var xScaleDomain = [];
        var xScaleRange = [];
        for (var i = 1; i <= this.props.metrics.accuracy.length; i++) {
            xScaleDomain.push(i);
        }
        var xScale = d3.scaleBand().domain(xScaleDomain).range([0, this.state.width]).padding(0.1);

        var yScale = d3.scaleLinear().domain([this.state.max, this.state.min]).nice()
            .range([0, this.state.height]);

        var xAxis = d3.axisBottom(xScale);
        var yAxis = d3.axisLeft(yScale);

        var precisionBarOffset = xScale.bandwidth() * 0.15;
        var precisionBarWidth = xScale.bandwidth() * 0.7;

        return (
            <svg id={"metrics-graph"} width={this.props.size[0]} height={this.props.size[1]}>
                <g transform={`translate(${this.state.margin.left},${this.state.margin.top})`}>
                    <LineAxis name={"metric-graph-x-axis"} axis={xAxis} top={this.state.height}/>
                    <LineAxis name={"metric-graph-y-axis"} axis={yAxis} top={0}/>
                    {this.props.metrics.accuracy.map((value, index) =>
                        <rect x={xScale(index + 1)} y={yScale(value)} height={yScale(0) - yScale(value)} width={xScale.bandwidth()} fill={this.props.colors[0]}></rect>
                    )}
                    {this.props.metrics.precision.map((value, index) =>
                        <rect x={xScale(index + 1) + precisionBarOffset} y={yScale(value)} height={yScale(0) - yScale(value)} width={precisionBarWidth} fill={this.props.colors[1]}></rect>
                    )}
                    </g>
            </svg>
        )
    }
}

class ProgressGraph extends React.Component {
  constructor(props) {
    super(props);
    var margin = {left: 50, right: 30, top: 20, bottom: 30};
    var width = props.size[0] - margin.left - margin.right;
    var height = props.size[1] - margin.top - margin.bottom;
    this.state = {
      margin: margin,
      width: width,
      height: height,
      min: 0.0,
      max: 1.0,
      keys: Object.keys(this.props.scores)
    };
    this.getDataPoints = this.getDataPoints.bind(this);
    this.getLineDrawFunction = this.getLineDrawFunction.bind(this);
    this.getXAxis = this.getXAxis.bind(this);
    this.combinePastScoresAndCurrentScores = this.combinePastScoresAndCurrentScores.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  componentDidMount() {

  }

  componentDidUpdate() {
  }


  getDataPoints(scores) {
    var keys = this.state.keys;
    var lineDataPoints = keys.map((key) =>
        scores[key].map((d, index) => [index+1, d])
    );
    return lineDataPoints;
  }

  onMouseEnter() {
  }

  onMouseLeave() {
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
      var keys = this.state.keys;
      var xScaleDomain = [];
      var xScaleRange = [];
      for (var i = 1; i <= this.props.scores[keys[0]].length; i++) {
          xScaleDomain.push(i);
      }
      var xScale = d3.scaleBand().domain(xScaleDomain).range([0, this.state.width]).padding(0.1);
      return xScale;
  }

  getLineDrawFunction(scores, xScale, yScale) {
      return d3.line().x(function(d) {return xScale(d[0]) + xScale.bandwidth() * 0.5 }).y(function(d) { return yScale(d[1])});
  }

  render(){
    console.log("progress graph");
    console.log(this.props);
    var keys = this.state.keys;

    var xScale = this.getXAxis();
    //console.log(xScale.bandwidth);
    //this.initializeMinMax(scores);

    var yScale = d3.scaleLinear().domain([this.props.max, this.props.min]).nice()
        .range([0, this.state.height]);

    var draw = this.getLineDrawFunction(this.props.scores, xScale, yScale); //d3.line().x(function(d) {return xScale(d[0])}).y(function(d) { return yScale(d[1])})

    var lineDataPoints = this.getDataPoints(this.props.scores);
    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);


    /*var focus;
    if (scores[keys[0]].length > 0) {
      focus = keys.map((key, index) =>
          <g transform={`translate(${xScale(this.props.selectedIndex) + xScale.bandwidth() * 0.5},${yScale(scores[key][this.props.selectedIndex])})`}>
              <circle r={5} fill={this.props.colors[index]}/>
              <text x={9}>{scores[key][this.props.selectedIndex]}</text>
          </g>);
    } else {
      focus = <div></div>;
    } */

    var displayPoints = keys.map((key, index1) =>
        this.props.scores[key].map((score, index2) =>
          <circle r={5} fill={this.props.colors[index1]} cx={xScale(index2 + 1) + xScale.bandwidth() * 0.5} cy={yScale(score)}/>
      )
    );

    var displayText = keys.map((key, index1) =>
        this.props.scores[key].map((score, index2) =>
            <text fontSize={12} x={xScale(index2 + 1) + xScale.bandwidth() * 0.5 - 3} y={yScale(score) - 5}>{score}</text>
        )
    );

    return (
      <svg id={"progress-graph-" + this.props.name} width={this.props.size[0]} height={this.props.size[1]}>
          <text>{"Title"}</text>
        <g className={"score-paths"} transform={`translate(${this.state.margin.left},${this.state.margin.top})`}>
          <LineAxis name={"progress-x-axis-" + this.props.name} axis={xAxis} top={this.state.height}/>
          <LineAxis name={"progress-y-axis-" + this.props.name} axis={yAxis} top={0}/>
          {
            lineDataPoints.map((points, index) =>
                <path className={"graphline"} d={draw(points)} stroke={this.props.colors[index]} stroke-width={3} fill={"none"} />
            )
          }
          <g className={"points"}>
              {displayPoints}
              {displayText}
          </g>
            <text x={this.state.width/2} y={this.state.height + this.state.margin.top + 10} textAnchor={"middle"} style={{fontSize: 12}}>{"Trial"}</text>
            <text x={0 - (this.state.height/2)} y={-35} transform={"rotate(-90)"} textAnchor={"middle"} style={{fontSize: 12}}>{this.props.yAxisLabel}</text>
        </g>
      </svg>
    )
  }
}

/*
<path className={"graphline"} d={draw(EKdata)} stroke={"red"} stroke-width={3} fill={"none"}/>
<path className={"graphline"} d={draw(MBdata)} stroke={"green"} stroke-width={3} fill={"none"}/>
<path className={"graphline"} d={draw(MIdata)} stroke={"blue"} stroke-width={3} fill={"none"}/>

<g className={"focus"} style={{fontSize: 11, fontFamily: "san-serif"}}>
    {focus}
</g>

{var precisionBarOffset = xScale.bandwidth() * 0.15;
    var precisionBarWidth = xScale.bandwidth() * 0.7;
            this.props.metrics.accuracy.map((value, index) =>
              <rect x={xScale(index)} y={yScale(value)} height={yScale(0) - yScale(value)} width={xScale.bandwidth()} fill={this.props.metricsColors[0]}></rect>
            )
          }
          {
            this.props.metrics.precision.map((value, index) =>
              <rect x={xScale(index) + precisionBarOffset} y={yScale(value)} height={yScale(0) - yScale(value)} width={precisionBarWidth} fill={this.props.metricsColors[1]}></rect>
            )
          } */