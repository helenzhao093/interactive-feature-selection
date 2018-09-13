/*** @jsx React.DOM */
// function that returns bars, set width, height, x, y, color
function VerticalHistogramBar(props) {
 return(
   <rect
     className={props.className}
     width={props.width} height={props.height}
     x={props.x} y={props.y}
     fill={props.fill}
   />
 )
}

class HistogramYAxis extends React.Component {
 constructor(props) {
   super(props)
 }

 componentDidMount() {
   var className = '.' + this.props.name
   d3.selectAll(className).call(this.props.axis)
 }

 componentDidUpdate() {
   console.log('update axis')
   var className = '.' + this.props.name
   d3.selectAll(className).call(this.props.axis)
 }

 render() {
   console.log('render axis')
   return(
     <g className={this.props.name} transform={`translate(${this.props.left},${this.props.top})` }/>
   )
 }
}

class VerticalHistogramBin extends React.Component {
 constructor(props) {
   super(props)
 }

 componentDidMount() {
 }

 componentDidUpdate() {
 }

 render(){
   console.log('render bin')
   return(
     <g className={'bin'}>
       {this.props.data.TP.map(bar =>
         <VerticalHistogramBar
           className={'TP'}
           width={this.props.xScale.bandwidth()}
           height={this.props.yScale(bar.count)}
           x={this.props.xScale(bar.bin)}
           y={this.props.height - this.props.yScale(bar.count + bar.previousSum)}
           fill={this.props.color(bar.className)}
         />
       )}
       {this.props.data.FN.map(bar=>
         <VerticalHistogramBar
           className={'FN'}
           width={this.props.xScale.bandwidth()}
           height={this.props.yScale(bar.count)}
           x={this.props.xScale(bar.bin)}
           y={this.props.height - this.props.yScale(bar.count + bar.previousSum)}
           fill={this.props.color(bar.className)}
         />
       )}
     </g>
   )
 }
}


class VerticalHistogram extends React.Component {
 constructor(props) {
   super(props)
   this.state = {
     max: props.max,
     tooltip: { count: 0, left: 0, top: 0},
     histogramHeight : props.size[1] - props.margin.top - props.margin.bottom,
     histogramWidth : props.size[0] - props.margin.left - props.margin.right,
     domain: props.domain,
     xAxisClassName: 'x-axis-' + props.name,
     yAxisClassName: 'y-axis-' + props.name,
     xAxis: props.xAxis,
     yAxis: props.yAxis,
     xScale: props.xScale,
     yScale: props.yScale
   }
   console.log(this.state)
 }

 componentDidMount() {

 }

 componentDidUpdate() {
 }

 /*onMouseEnter(data, x, y) {
   // update histogram state with new tooltip
   console.log(data, x, y)
   //console.log('hi')
   //d3.selectAll(".histogram-tooltip").html(data)
   this.setState({tooltip: {data: data, left: x, top: y}})
 }*/

 render() {
   console.log('render vertical histogram')

   var bins = this.props.data.map( bin =>
     <VerticalHistogramBin
      bottom={this.props.margin.bottom}
      data={bin} xScale={this.state.xScale}
      yScale={this.state.yScale}
      color={this.props.colorFunction}
      height={this.state.histogramHeight}
      />)

   return (
     // TODO: convert to tooltip component
     <div className={"histogram-div"}>
       <svg className={`${this.props.name}-histogram`} width={this.props.size[0]} height={this.props.size[1]}>
         <g transform={`translate(${this.props.margin.left},${this.props.margin.top})`}>
           {bins}
         </g>
         <HistogramYAxis name={this.state.yAxisClassName} axis={this.state.yAxis} left={this.props.margin.left } top={this.props.margin.top}/>
         <HistogramYAxis name={this.state.xAxisClassName} axis={this.state.xAxis} left={this.props.margin.left } top={this.state.histogramHeight + this.props.margin.top} />
       </svg>

     </div>
   )
 }
}

//export default Histogram
