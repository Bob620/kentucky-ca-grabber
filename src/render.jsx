const ReactDOM = require('react-dom');
const React = require('react');

function Render(App) {
  document.addEventListener("DOMContentLoaded", () => {
  	ReactDOM.render(
      <App />,
      document.getElementById('App')
    );
  }, false);
}

module.exports = Render;
