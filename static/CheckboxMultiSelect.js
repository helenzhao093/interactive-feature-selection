class CheckboxOption extends React.Component {
  render() {
    console.log('checkbox')
    const { value, isChecked, children } = this.props
    return (
      <ul className={"react-select-option"} value={value}>
        <input
          type={"checkbox"}
          className={"react-select-option__checkbox"}
          defaultValue={null}
          checked={isChecked}
          onChange={this.props.onChange}
        />
        <div className={"react-select-option__label"}>
          {children}
        </div>
      </ul>
    )
  }
}

class CheckboxMultiSelect extends React.Component {
  constructor(props) {
    super(props)
    console.log(props)

    this.state = {
      defaultValue: 'Select a class'
    }

  }

  render() {
    const { defaultValue } = this.state
    var displayValues = Object.keys(this.props.options).filter((option) =>
       this.props.options[option].TP.display == true
    )
    console.log(displayValues)
    return (
      <div className={'react-select'}>
        <div className={"select-button"}>
          <button className={"react-select-trigger"}>
            { displayValues.length > 0
              ? displayValues.join(', ')
              : defaultValue
            }
          </button>
        </div>
        <div className={"react-select-menu"}>
          <ul className={"react-select-options"}>
            {Object.keys(this.props.options).map((option) =>
              <CheckboxOption value={option} isChecked={this.props.options[option].TP.display}
                onChange={() => this.props.handleChange(option, this.props.options[option].TP.display)}>
                {option}
              </CheckboxOption>)
            }
          </ul>
        </div>
        </div>
    )
  }
}
