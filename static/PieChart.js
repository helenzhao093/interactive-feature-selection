class PieChart extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            radius: Math.min(this.props.size[0], this.props.size[1]) / 2
        }
    }

    componentDidMount() {
    }

    componentDidUpdate() {
    }

    render(){
        //console.log(this.props.selection);
        var arc = d3.arc()
            .innerRadius(0)
            .outerRadius(this.state.radius);

        var pie = d3.pie()
            .value(function(d) { return 1 });

        var arcs = pie(this.props.data);
        //console.log(arcs)
        var displayGray = true;
        return (
            <svg width={this.props.size[0]} height={this.props.size[1]}>
                <g transform={`translate(${this.props.size[0]/2},${this.state.radius})`}>
                    {arcs.map((slice, index) =>
                        <g className={"slice"}>
                            <path fill={this.props.selection.includes(this.props.data[index]) ? "#b9d9ff" : "#a9a9a9"} stroke={"gray"} strokeWidth={2} d={arc(slice)}></path>
                        </g>)
                    }
                    {arcs.map((slice, index) =>
                        <g className={"slice"}>
                            <text transform={`translate(${arc.centroid(slice)})`} textAnchor={"middle"}>{this.props.data[index]}</text>
                        </g>)
                    }
                </g>
            </svg>
        )
    }
}