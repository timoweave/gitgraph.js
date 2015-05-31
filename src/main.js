var GitGraph = require( "./gitgraph" );
var Branch = require( "./branch" );
var Commit = require( "./commit" );
var Template = require( "./template" );

(function () {
  "use strict";

  // Expose GitGraph object
  window.GitGraph = GitGraph;
  window.GitGraph.Branch = Branch;
  window.GitGraph.Commit = Commit;
  window.GitGraph.Template = Template;
})();
