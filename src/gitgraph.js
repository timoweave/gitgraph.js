var Branch = require( "./branch" );
var Template = require( "./template" );
var utils = require( "./utils" );

/**
 * GitGraph
 *
 * @constructor
 *
 * @param {Object} options - GitGraph options
 * @param {String} [options.elementId = "gitGraph"] - Id of the canvas container
 * @param {Template|String|Object} [options.template] - Template of the graph
 * @param {String} [options.author = "Sergio Flores <saxo-guy@epic.com>"] - Default author for commits
 * @param {String} [options.mode = (null|"compact")]  - Display mode
 * @param {HTMLElement} [options.canvas] - DOM canvas (ex: document.getElementById("id"))
 * @param {String} [options.orientation = ("vertical-reverse"|"horizontal"|"horizontal-reverse")] - Graph orientation
 *
 * @this GitGraph
 **/
function GitGraph ( options ) {
  // Options
  options = (typeof options === "object") ? options : {};
  this.elementId = (typeof options.elementId === "string") ? options.elementId : "gitGraph";
  this.author = (typeof options.author === "string") ? options.author : "Sergio Flores <saxo-guy@epic.com>";

  // Template management
  if ( (typeof options.template === "string")
       || (typeof options.template === "object") ) {
    this.template = this.newTemplate( options.template );
  }
  else if ( options.template instanceof Template ) {
    this.template = options.template;
  }
  else {
    this.template = this.newTemplate( "metro" );
  }

  this.mode = options.mode || null;
  if ( this.mode === "compact" ) {
    this.template.commit.message.display = false;
  }
  this.marginX = this.template.commit.dot.size * 2;
  this.marginY = this.template.commit.dot.size * 2;
  this.offsetX = 0;
  this.offsetY = 0;

  // Orientation
  switch ( options.orientation ) {
  case "vertical-reverse" :
    this.template.commit.spacingY *= -1;
    this.orientation = "vertical-reverse";
    break;
  case "horizontal" :
    this.template.commit.message.display = false;
    this.template.commit.spacingX = this.template.commit.spacingY;
    this.template.branch.spacingY = this.template.branch.spacingX;
    this.template.commit.spacingY = 0;
    this.template.branch.spacingX = 0;
    this.orientation = "horizontal";
    break;
  case "horizontal-reverse" :
    this.template.commit.message.display = false;
    this.template.commit.spacingX = -this.template.commit.spacingY;
    this.template.branch.spacingY = this.template.branch.spacingX;
    this.template.commit.spacingY = 0;
    this.template.branch.spacingX = 0;
    this.orientation = "horizontal-reverse";
    break;
  default:
    this.orientation = "vertical";
    break;
  }

  // Canvas init
  this.canvas = document.getElementById( this.elementId ) || options.canvas;
  this.context = this.canvas.getContext( "2d" );

  // Tooltip layer
  this.tooltip = document.createElement( "div" );
  this.tooltip.className = "gitgraph-tooltip";
  this.tooltip.style.position = "fixed";
  this.tooltip.style.display = "none";

  // Add tooltip div into body
  document.body.appendChild( this.tooltip );

  // Navigation vars
  this.HEAD = null;
  this.branchs = [];
  this.commits = [];

  // Utilities
  this.columnMax = 0; // nb of column for message position
  this.commitOffsetX = 0;
  this.commitOffsetY = 0;

  // Bindings
  var mouseMoveOptions = {
    handleEvent: this.hover,
    gitgraph: this
  };
  this.canvas.addEventListener( "mousemove", mouseMoveOptions, false );

  // Render on window resize
  window.onresize = this.render.bind( this );
}

/**
 * Create new branch
 *
 * @param {(String | Object)} options - Branch name | Options of Branch
 *
 * @see Branch
 * @this GitGraph
 *
 * @return {Branch} New branch
 **/
GitGraph.prototype.branch = function ( options ) {
  // Options
  if ( typeof options === "string" ) {
    var name = options;
    options = {};
    options.name = name;
  }

  options = (typeof options === "object") ? options : {};
  options.parent = this;
  options.parentBranch = options.parentBranch || this.HEAD;

  // Add branch
  var branch = new Branch( options );
  this.branchs.push( branch );

  // Return
  return branch;
};

/**
 * Create new orphan branch
 *
 * @param {(String | Object)} options - Branch name | Options of Branch
 *
 * @see Branch
 * @this GitGraph
 *
 * @return {Branch} New branch
 **/
GitGraph.prototype.orphanBranch = function ( options ) {
  // Options
  if ( typeof options === "string" ) {
    var name = options;
    options = {};
    options.name = name;
  }

  options = (typeof options === "object") ? options : {};
  options.parent = this;

  // Add branch
  var branch = new Branch( options );
  this.branchs.push( branch );

  // Return
  return branch;
};

/**
 * Commit on HEAD
 *
 * @param {Object} options - Options of commit
 *
 * @see Commit
 * @this GitGraph
 *
 * @return {GitGraph} this - Return the main object so we can chain
 **/
GitGraph.prototype.commit = function ( options ) {
  this.HEAD.commit( options );

  // Return the main object so we can chain
  return this;
};

/**
 * Create a new template
 *
 * @param {(String|Object)} options - The template name, or the template options
 *
 * @return {Template}
 **/
GitGraph.prototype.newTemplate = function ( options ) {
  if ( typeof options === "string" ) {
    return new Template().get( options );
  }
  return new Template( options );
};

/**
 * Render the canvas
 *
 * @this GitGraph
 **/
GitGraph.prototype.render = function () {
  var backingStorePixelRatio;
  var scalingFactor;

  // Account for high-resolution displays
  scalingFactor = 1;

  if ( window.devicePixelRatio ) {
    backingStorePixelRatio = this.context.webkitBackingStorePixelRatio ||
                             this.context.mozBackingStorePixelRatio ||
                             this.context.msBackingStorePixelRatio ||
                             this.context.oBackingStorePixelRatio ||
                             this.context.backingStorePixelRatio || 1;

    scalingFactor *= window.devicePixelRatio / backingStorePixelRatio;
  }

  // Resize canvas
  var unscaledResolution = {
    x: Math.abs( this.columnMax * this.template.branch.spacingX )
       + Math.abs( this.commitOffsetX )
       + this.marginX * 2,
    y: Math.abs( this.columnMax * this.template.branch.spacingY )
       + Math.abs( this.commitOffsetY )
       + this.marginY * 2
  };

  if ( this.template.commit.message.display ) {
    unscaledResolution.x += 800;
  }

  this.canvas.style.width = unscaledResolution.x + "px";
  this.canvas.style.height = unscaledResolution.y + "px";

  this.canvas.width = unscaledResolution.x * scalingFactor;
  this.canvas.height = unscaledResolution.y * scalingFactor;

  this.context.scale( scalingFactor, scalingFactor );

  // Clear All
  this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );

  // Add some margin
  this.context.translate( this.marginX, this.marginY );

  // Translate for inverse orientation
  if ( this.template.commit.spacingY > 0 ) {
    this.context.translate( 0, this.canvas.height - this.marginY * 2 );
    this.offsetY = this.canvas.height - this.marginY * 2;
  }
  if ( this.template.commit.spacingX > 0 ) {
    this.context.translate( this.canvas.width - this.marginX * 2, 0 );
    this.offsetX = this.canvas.width - this.marginX * 2;
  }

  // Render branchs
  for ( var i = this.branchs.length - 1, branch; !!(branch = this.branchs[ i ]); i-- ) {
    branch.render();
  }

  // Render commits after to put them on the foreground
  for ( var j = 0, commit; !!(commit = this.commits[ j ]); j++ ) {
    commit.render();
  }
};

/**
 * Hover event on commit dot
 *
 * @param {MouseEvent} event - Mouse event
 *
 * @self Gitgraph
 **/
GitGraph.prototype.hover = function ( event ) {
  var self = this.gitgraph;
  var isOut = true;

  // Fix firefox MouseEvent
  event.offsetX = event.offsetX ? event.offsetX : event.layerX;
  event.offsetY = event.offsetY ? event.offsetY : event.layerY;
  event.x = event.x ? event.x : event.clientX;
  event.y = event.y ? event.y : event.clientY;

  function showCommitTooltip () {
    self.tooltip.style.left = event.x + "px"; // TODO Scroll bug
    self.tooltip.style.top = event.y + "px";  // TODO Scroll bug
    self.tooltip.textContent = commit.sha1 + " - " + commit.message;
    self.tooltip.style.display = "block";
  }

  function emitMouseoverEvent () {
    var mouseoverEventOptions = {
      author: commit.author,
      message: commit.message,
      date: commit.date,
      sha1: commit.sha1
    };

    utils.emitEvent( self.canvas, "commit:mouseover", mouseoverEventOptions );
  }

  for ( var i = 0, commit; !!(commit = this.gitgraph.commits[ i ]); i++ ) {
    var distanceX = (commit.x + self.offsetX + self.marginX - event.offsetX);
    var distanceY = (commit.y + self.offsetY + self.marginY - event.offsetY);
    var distanceBetweenCommitCenterAndMouse = Math.sqrt( Math.pow( distanceX, 2 ) + Math.pow( distanceY, 2 ) );
    var isOverCommit = distanceBetweenCommitCenterAndMouse < self.template.commit.dot.size;

    if ( isOverCommit ) {
      if ( !self.template.commit.message.display ) {
        showCommitTooltip();
      }

      if ( !commit.isMouseover ) {
        emitMouseoverEvent();
      }

      isOut = false;
      commit.isMouseover = true;
    } else {
      commit.isMouseover = false;
    }
  }

  if ( isOut ) {
    self.tooltip.style.display = "none";
  }
};

module.exports = GitGraph;
