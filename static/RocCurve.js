class RocCurve extends React.Component {
 constructor(props) {
   console.log(props)
   super(props)
   var margin = {left: 50, right: 30, top: 20, bottom: 30};
   var width = props.size[0] - margin.left - margin.right;
   var height = props.size[1] - margin.top - margin.bottom;

   var fprScale = d3.scaleLinear().domain([0, 1]).range([0, width]);
   var tprScale = d3.scaleLinear().domain([1, 0]).range([0, height]);
   var fprAxis = d3.axisBottom(fprScale);
   var tprAxis = d3.axisLeft(tprScale);
   this.state = {
     margin: margin,
     width: width,
     height: height,
     tprScale: tprScale,
     fprScale: fprScale,
     fprAxis: fprAxis,
     tprAxis: tprAxis
   }
   this.getDrawFunction = this.getDrawFunction.bind(this);
 }

 componentDidMount() {

 }

 componentDidUpdate() {

 }

 getDrawFunction(fprScale, tprScale){
   return d3.line().x(function(d) { return fprScale(d[0])}).y(function(d) { return tprScale(d[1])});
 }

 render() {
   console.log(this.props.displayClass);
   var solidLines = Object.keys(this.props.rocCurve).filter((label) => this.props.displayClass[label].TP.display == true );
   var dashLines = Object.keys(this.props.rocCurveTwo).filter((label) => this.props.displayClass[label].TP.display == true );


   var draw = this.getDrawFunction(this.state.fprScale, this.state.tprScale);//= d3.line().x(function(d) { return console.log(d); that.state.fprScale(d[0])}).y(function(d) { return that.state.tprScale(d[1])});
   return(
     <svg id={'auc-graph-' + this.props.name} width={this.props.size[0]} height={this.props.size[1]}>
       <g transform={`translate(${this.state.margin.left},${this.state.margin.top})`}>
        <LineAxis name={"fpr-axis-" + this.props.name} axis={this.state.fprAxis} top={this.state.height}/>
        <LineAxis name={"tpr-axis-" + this.props.name} axis={this.state.tprAxis} top={0}/>
        {
          solidLines.map((label, index) =>
            <path className={"graphline"} d={draw(this.props.rocCurve[label])}
                  stroke={this.props.colors(label)} stroke-width={3} fill={"none"} />
          )
        }
        {
          dashLines.map((label, index) =>
            <path className={"graphline"} d={draw(this.props.rocCurveTwo[label])} strokeDasharray={"4, 4"}
                  stroke={this.props.colors(label)} stroke-width={3} fill={"none"} />
          )
        }
        <text x={this.state.width/2} y={this.state.height + this.state.margin.top + 10} textAnchor={"middle"} style={{fontSize: 12}}>{"False Positive Rate"}</text>
        <text x={0 - (this.state.height/2)} y={-35} transform={"rotate(-90)"} textAnchor={"middle"} style={{fontSize: 12}}>{"True Positive Rate"}</text>
       </g>
     </svg>
   )
 }
}
