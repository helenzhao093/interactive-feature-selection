class Tabs extends React.Component {

    constructor(props, context) {
        super(props, context);
    }



    // Encapsulate <Tabs/> component API as props for <Tab/> children
    renderChildrenWithTabsApiAsProps() {
        return React.Children.map(this.props.children, (child, index) => {
            return React.cloneElement(child, {
                onClick : this.props.handleTabClick,
                tabIndex: index,
                isActive: index === this.props.activeTabIndex
            });
        });
    }

    // Render current active tab content
    renderActiveTabContent() {
        const children = this.props.children;
        const activeTabIndex = this.props.activeTabIndex;
        if(children[activeTabIndex]) {
            return children[activeTabIndex].props.children;
        }
    }

    render() {
        return (
            <div className="tabs">
                <ul>
                    {this.renderChildrenWithTabsApiAsProps()}
                </ul>
                <div className="tabs-active-content">
                    {this.renderActiveTabContent()}
                </div>
            </div>
        );
    }
};

Tabs.propTypes = {
    defaultActiveTabIndex: React.PropTypes.number
};

Tabs.defaultProps = {
    defaultActiveTabIndex: null
};

class Tab extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.handleTabClick = this.handleTabClick.bind(this);
    }



    handleTabClick(event) {
        event.preventDefault();
        this.props.onClick(this.props.tabIndex);
    }

    render() {
        return (
            <li className="tab"  onClick={this.handleTabClick}>
                <a className={`tab-link ${this.props.linkClassName} ${this.props.isActive ? 'active' : ''}`}>
                    {this.props.linkClassName}
                </a>
                <i className={"arrow"}></i>
            </li>
        );
    }
}

Tab.propTypes = {
    onClick      : React.PropTypes.func,
    tabIndex     : React.PropTypes.number,
    isActive     : React.PropTypes.bool,
    iconClassName: React.PropTypes.string.isRequired,
    linkClassName: React.PropTypes.string.isRequired
};

Tabs.propTypes = {
    defaultActiveTabIndex: React.PropTypes.number
};

Tabs.defaultProps = {
    defaultActiveTabIndex: 0
};
