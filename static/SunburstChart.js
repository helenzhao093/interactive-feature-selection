class SunburstChart extends React.Component {
    constructor(props) {
        super(props)
        console.log(props)
        const numCircle = 4;
        var radii = [];
        const dy = 30;
        const largestRadius = Math.min(this.props.size[0], this.props.size[1]) / 2;
        var colorFunction = d3.scaleOrdinal().range(['#ffffff','#e9f2fb', '#cfe1f2', '#a6cde4', '#7bb7d9', '#4694c7', '#2574b5', '#1059a1', '#083979']).domain([0,1,2,3,4,5,6,7,8])
        var colorMB = d3.scaleOrdinal().range(['#7e6699', '#f08036']).domain(['MB', 'NotMB']);
        for (var i = 0; i < numCircle; i++) {
            radii.unshift(largestRadius - dy * i);
        }
        this.state = {
            radii: radii,
            colorFunction: colorFunction,
            colorMB: colorMB
        }
    }

    componentDidMount() {
    }

    componentDidUpdate() {
    }

    render(){
        var arc1 = d3.arc()
            .innerRadius(this.state.radii[0])
            .outerRadius(this.state.radii[1]);


        var pie1 = d3.pie()
            .value(function(d) { return d.MB.length + d.NotMB.length })
            .sort(null);


        var arcs1 = pie1(this.props.data);

        var arc2 = d3.arc()
            .innerRadius(this.state.radii[1])
            .outerRadius(this.state.radii[2])


        var pie2Data = [];
        var pie2DataLabel = [];
        this.props.data.map((rankData) =>
            {
                if (rankData.MB.length > 0) {
                    pie2Data.push(rankData.MB);
                    pie2DataLabel.push("MB");
                }
                if (rankData.NotMB.length > 0) {
                    pie2Data.push(rankData.NotMB);
                    pie2DataLabel.push("NotMB");
                }
            }
        );

        var pie2 = d3.pie()
            .value(function(d) { return d.length })
            .sort(null);

        var arcs2 = pie2(pie2Data);

        var arc3 = d3.arc()
            .innerRadius(this.state.radii[2])
            .outerRadius(this.state.radii[3])


        var pie3 = d3.pie()
            .value(function(d) {return 1})
            .sort(null);

        var pie3Data = pie2Data.flat();

        var arcs3 = pie3(pie3Data);
        return (
            <svg width={this.props.size[0]} height={this.props.size[1]}>
                <g transform={`translate(${this.state.radii[3]},${this.state.radii[3]})`}>
                    {arcs1.map((slice, index) =>
                        <g className={"slice"}>
                            <path fill={this.state.colorFunction(this.props.data[index].rank)} stroke={"white"} strokeWidth={2} d={arc1(slice)}></path>
                            <text transform={`translate(${arc1.centroid(slice)})`} textAnchor={"middle"}>{this.props.data[index].rank}</text>
                        </g>
                    )
                    }
                </g>
                <g transform={`translate(${this.state.radii[3]},${this.state.radii[3]})`}>
                    {arcs2.map((slice, index) =>
                        <g className={"slice"}>
                            <path fill={this.state.colorMB(pie2DataLabel[index])} stroke={"white"} strokeWidth={2} d={arc2(slice)}></path>
                        </g>
                    )
                    }
                </g>
                <g transform={`translate(${this.state.radii[3]},${this.state.radii[3]})`}>
                    {arcs3.map((slice, index) =>
                        <g className={"slice"}>
                            <path fill={this.props.selection.includes(pie3Data[index])? "#b9d9ff" : "#a9a9a9"} stroke={"white"} strokeWidth={2} d={arc3(slice)}></path>
                            <text transform={`translate(${arc3.centroid(slice)})`} textAnchor={"middle"}>{pie3Data[index]}</text>
                        </g>
                    )
                    }
                </g>
            </svg>
        )
    }
}

/*
                            <!--<text transform={`translate(${arc2.centroid(slice)})`} textAnchor={"middle"}>{pie2DataLabel[index]}</text> -->

 */