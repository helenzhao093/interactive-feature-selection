/*** @jsx React.DOM */
import React from "react"
import ReactDOM from "react-dom";
import { Interface } from "./Interface"

ReactDOM.render(
  <Interface />,
  document.getElementById('root')
);
/*class App extends React.Component {

  constructor(props){
    this.getData = this.getData.bind(this)
    this.state = {
      data: null
    }
  }

  getData(url){
    fetch(url, {
      method: 'GET',
    }).then(function(response) {
      return response.json();
    }).then(data =>
      console.log(data)
    ).catch(function(error) {
      console.log(error)
    })
  }

  render() {
    this.getData
    return (
      <div> </div>
    )
  }
} */

/*getData()
  .then(data => {
  console.log(Interface);
    ReactDOM.render(
      React.createElement('Interface',
      {data: data.histogramData,
      featureData: data.featureData,
      summaryData: data.summaryData,
      featureDistribution: data.featureDistribution}),
      document.getElementById('root')
    );
  })*/
