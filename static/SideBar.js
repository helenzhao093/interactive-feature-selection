class SideBarItem extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {

    }

    componentDidUpdate() {

    }

    render() {
        return (
            <div>
                <button className={"sidebar-item"} onClick={() => this.props.toggleDisplay(this.props.index)}>{this.props.feature.name}</button>
                <div className={"collapsible-content sidebar-item"} style={{display: this.props.display? "block" : "none"}}>
                    <p>
                        {this.props.feature.description}
                    </p>
                </div>
            </div>
        )
    }
}

class SideBar extends React.Component {
    constructor(props) {
        super(props);
        console.log(props)
        var displays = this.props.featureInfo.map((feature) => false);
        this.state = {
            displays: displays
        };
        this.toggleDisplay = this.toggleDisplay.bind(this);
        console.log(this.state)
    }

    /*shouldComponentUpdate(nextProps, nextState) {
        return !(nextProps.show == this.props.show);
    }*/

    componentDidMount() {

    }

    componentDidUpdate() {

    }

    toggleDisplay(itemIndex) {
        console.log(itemIndex)
        var displays = this.state.displays;
        displays[itemIndex] = !this.state.displays[itemIndex];
        this.setState({
            displays: displays
        });
    }

    render() {
        console.log('sidebar');
        return (
            <div className={"sidebar-right sidebar-card animate-right"} style={{display: this.props.show ? "block" : "none"}}>
                <button className={"sidebar-item"} onClick={this.props.close}>{"Close x"}</button>
                {this.props.featureInfo.map((feature, index) =>
                    <SideBarItem feature={feature} toggleDisplay={this.toggleDisplay} index={index} display={this.state.displays[index]}/>
                )}

            </div>
        )
    }
}
