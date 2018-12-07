class TrialSelection extends React.Component {
    constructor(props) {
        super(props)
        console.log(props)
    }

    render() {
        return (
            <div>
                <select onChange={ this.props.changeTrial }>
                    {this.props.trials.map((trial, index) =>
                        <option selected={(index == this.props.selected) ? "selected": "" }
                                key={trial} value={String(this.props.classifierNum) + String(index)}>{trial}</option>
                    )}
                </select>
            </div>
        )
    }
}

class ConfusionMatrix extends React.Component {
    constructor(props){
        super(props)
        //console.log(this.props)
    }

    componentDidMount() {

    }

    componentDidUpdate(){

    }

    render() {
        let cellSize = 40;
        var colorScale = d3.scaleSequential(d3.interpolateOranges).domain([0, 1]);

        var topOffSet=70;
        var leftOffSet=40;
        var offSetScale = 10;
        var totalWidth = cellSize * (this.props.classNames.length + 2) + leftOffSet + offSetScale;
        var totalHeight = cellSize * (this.props.classNames.length) + topOffSet;

        var colorScaleAxis = d3.scaleSequential(d3.interpolateOranges).domain([0, this.props.classNames.length * cellSize]);
        var scaleArray = d3.range(0, this.props.classNames.length * cellSize, 1);
        return (
            <svg width={totalWidth} height={totalHeight}>

                <g transform={`translate(${totalWidth/2 + cellSize/2},${cellSize/2})`}>
                    <text textAnchor={"middle"}>{"Predicted"}</text>
                </g>
                <g transform={`translate(30,${totalHeight/2 + cellSize/2}) rotate(-90)`}>
                    <text textAnchor={"middle"}>{"Actual"}</text>
                </g>

                <g transform={`translate(${leftOffSet},${topOffSet})`}>
                {this.props.classNames.map((name,index) =>
                    <g transform={`translate(${index * cellSize + cellSize/2}) rotate(-45)`}>
                        <text>{name}</text>
                    </g>
                )}
                </g>

                {this.props.matrix.map((row,index) =>
                    <g transform={`translate(${leftOffSet},${index*cellSize + topOffSet})`}>
                        {row.map((data, index2) =>
                            <g transform={`translate(${index2*cellSize})`}>
                                <rect x={0} y={0}
                                  width={cellSize} height={cellSize}
                                  stroke={"black"} strokeWidth={0}
                                  fill={colorScale(this.props.normalizedMatrix[index][index2])}>
                                </rect>
                                <text x={"20"} y={"25"} textAnchor={"middle"}>{data}</text>
                            </g>
                        )}
                    </g>
                )}

                <g transform={`translate(${cellSize * this.props.classNames.length + leftOffSet + offSetScale},${topOffSet})`}>

                    <text x={cellSize/2} y={15}>{0.0}</text>
                    <text x={cellSize/2} y={cellSize * this.props.classNames.length}>{1.0}</text>
                    {scaleArray.map((d,i) =>
                        <rect x={0} y={i}
                              height={1} width={cellSize/2}
                              fill={colorScaleAxis(d)}></rect>
                    )}
                </g>
            </svg>
        )
    }
}

class CompareClassifiers extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        console.log(this.props);
        let selectedTrial1 = this.props.selectedTrial1;
        let confusionMatrix = this.props.confusionMatrices[selectedTrial1];
        let confusionMatrixNormalized = this.props.confusionMatricesNormalized[selectedTrial1];
        var secondClassifier;
        if (this.props.selectedTrial2 >= 0) {
            secondClassifier = <div className={"grid-item second"}>
                <TrialSelection classifierNum={2} changeTrial={this.props.changeTrial} trials={this.props.trials}
                                selected={this.props.selectedTrial2}/>
                <ConfusionMatrix
                    matrix={this.props.confusionMatrices[this.props.selectedTrial2]}
                    normalizedMatrix={this.props.confusionMatricesNormalized[this.props.selectedTrial2]}
                    classNames={this.props.classNames}
                />
            </div>
        } else {
            secondClassifier = <div className={"grid-item-comparison"}> </div>
        }

        return (
            <div className={"grid-container-comparison"}>
                <div className={"grid-item first"}>
                    <TrialSelection classifierNum={1} changeTrial={this.props.changeTrial} trials={this.props.trials}
                        selected={this.props.selectedTrial1}/>
                    <ConfusionMatrix
                        matrix={ confusionMatrix }
                        normalizedMatrix={ confusionMatrixNormalized }
                        classNames={ this.props.classNames }
                    />
                </div>
                {secondClassifier}
            </div>

        )
    }
}