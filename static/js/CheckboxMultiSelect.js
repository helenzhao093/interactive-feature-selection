class CheckboxOption extends React.Component {
  render() {
    console.log('checkbox')
    const { value, isChecked, children } = this.props
    return (
      <div className={"checkbox"}  width={100}>
        <input
            id={value}
          type={"checkbox"}
          className={"react-select-option__checkbox"}
          defaultValue={null}
          checked={isChecked}
          onChange={this.props.onChange}
        />
      </div>
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
    return (
        <div style={{position: "relative", float: "left"}}>
            {Object.keys(this.props.options).map((option) =>
              <CheckboxOption value={option} isChecked={this.props.options[option].TP.display}
                onChange={() => this.props.handleChange(option, this.props.options[option].TP.display)}>
                {option}
              </CheckboxOption>)
            }
        </div>
    )
  }
}
