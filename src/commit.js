var utils = require( "./utils" );

/**
 * Commit
 *
 * @constructor
 *
 * @param {Object} options - Commit options
 * @param {GitGraph} options.parent - Instance of GitGraph
 * @param {Number} options.x - Position X (dot)
 * @param {Number} options.y - Position Y (dot)
 * @param {String} options.color - Master color (dot & message)
 * @param {Boolean} options.arrowDisplay - Add a arrow under commit dot
 * @param {String} [options.author = this.parent.author] - Author name & email
 * @param {String} [options.date] - Date of commit, default is now
 * @param {String} [options.detail] - DOM Element of detail part
 * @param {String} [options.sha1] - Sha1, default is a random short sha1
 * @param {String} [options.dotColor = options.color] - Specific dot color
 * @param {Number} [options.dotSize = this.template.commit.dot.size] - Dot size
 * @param {Number} [options.dotStrokeWidth = this.template.commit.dot.strokeWidth] - Dot stroke width
 * @param {Number} [options.dotStrokeColor = this.template.commit.dot.strokeColor]
 * @param {Commit} [options.parentCommit] - Parent commit
 * @param {String} [options.message = "He doesn't like George Michael! Boooo!"] - Commit message
 * @param {String} [options.messageColor = options.color] - Specific message color
 * @param {Boolean} [options.messageDisplay = this.template.commit.message.display] - Commit message policy
 * @param {Boolean} [options.messageAuthorDisplay = this.template.commit.message.displayAuthor] - Commit message author policy
 * @param {Boolean} [options.messageHashDisplay = this.template.commit.message.displayHash] - Commit message hash policy
 * @param {String} [options.type = ("mergeCommit"|null)] - Type of commit
 *
 * @this Commit
 **/
function Commit ( options ) {
  // Options
  options = (typeof options === "object") ? options : {};
  this.parent = options.parent;
  this.template = this.parent.template;
  this.context = this.parent.context;
  this.branch = options.branch;
  this.author = options.author || this.parent.author;
  this.date = options.date || new Date().toUTCString();
  this.detail = options.detail || null;
  this.sha1 = options.sha1 || (Math.random( 100 )).toString( 16 ).substring( 3, 10 );
  this.message = options.message || "He doesn't like George Michael! Boooo!";
  this.arrowDisplay = options.arrowDisplay;
  this.messageDisplay = utils.booleanOptionOr( options.messageDisplay, this.template.commit.message.display );
  this.messageAuthorDisplay = utils.booleanOptionOr( options.messageAuthorDisplay, this.template.commit.message.displayAuthor );
  this.messageHashDisplay = utils.booleanOptionOr( options.messageHashDisplay, this.template.commit.message.displayHash );
  this.messageColor = options.messageColor || options.color;
  this.messageFont = options.messageFont || this.template.commit.message.font;
  this.dotColor = options.dotColor || options.color;
  this.dotSize = options.dotSize || this.template.commit.dot.size;
  this.dotStrokeWidth = options.dotStrokeWidth || this.template.commit.dot.strokeWidth;
  this.dotStrokeColor = options.dotStrokeColor || this.template.commit.dot.strokeColor || options.color;
  this.type = options.type || null;
  this.parentCommit = options.parentCommit;
  this.x = options.x;
  this.y = options.y;

  this.parent.commits.push( this );
}

/**
 * Render the commit
 *
 * @this Commit
 **/
Commit.prototype.render = function () {
  // Dot
  this.context.beginPath();
  this.context.arc( this.x, this.y, this.dotSize, 0, 2 * Math.PI, false );
  this.context.fillStyle = this.dotColor;
  this.context.strokeStyle = this.dotStrokeColor;
  this.context.lineWidth = this.dotStrokeWidth;

  if ( typeof (this.dotStrokeWidth) === "number" ) {
    this.context.stroke();
  }

  this.context.fill();
  this.context.closePath();

  // Arrow
  if ( this.arrowDisplay && this.parentCommit instanceof Commit ) {
    this.arrow();
  }

  // Detail
  if ( this.detail !== null ) {
    this.detail.style.left = this.parent.canvas.offsetLeft + (this.parent.columnMax + 1) * this.template.branch.spacingX + 30 + "px";
    this.detail.style.top = this.parent.canvas.offsetTop + this.y + 40 + "px";
    this.detail.width = 30;
  }

  // Message
  if ( this.messageDisplay ) {
    var message = this.message;
    if ( this.messageHashDisplay ) {
      message = this.sha1 + " " + message;
    }
    if ( this.messageAuthorDisplay ) {
      message = message + (this.author ? " - " + this.author : "");
    }

    this.context.font = this.messageFont;
    this.context.fillStyle = this.messageColor;
    this.context.fillText( message, (this.parent.columnMax + 1) * this.template.branch.spacingX, this.y + 3 );
  }
};

/**
 * Render a arrow before commit
 *
 * @this Commit
 **/
Commit.prototype.arrow = function Arrow () {
  // Options
  var size = this.template.arrow.size;
  var color = this.template.arrow.color || this.branch.color;

  // Angles calculation
  var alpha = Math.atan2(
    this.parentCommit.y - this.y,
    this.parentCommit.x - this.x
  );

  // Merge & Fork case
  if ( this.type === "mergeCommit" || this === this.branch.commits[ 0 ] /* First commit */ ) {
    alpha = Math.atan2(
      this.template.branch.spacingY * (this.parentCommit.branch.column - this.branch.column) + this.template.commit.spacingY,
      this.template.branch.spacingX * (this.parentCommit.branch.column - this.branch.column) + this.template.commit.spacingX
    );
    color = this.parentCommit.branch.color;
  }

  var delta = Math.PI / 7; // Delta between left & right (radian)

  // Top
  var h = this.template.commit.dot.size + this.template.arrow.offset;
  var x1 = h * Math.cos( alpha ) + this.x;
  var y1 = h * Math.sin( alpha ) + this.y;

  // Bottom left
  var x2 = (h + size) * Math.cos( alpha - delta ) + this.x;
  var y2 = (h + size) * Math.sin( alpha - delta ) + this.y;

  // Bottom center
  var x3 = (h + size / 2) * Math.cos( alpha ) + this.x;
  var y3 = (h + size / 2) * Math.sin( alpha ) + this.y;

  // Bottom right
  var x4 = (h + size) * Math.cos( alpha + delta ) + this.x;
  var y4 = (h + size) * Math.sin( alpha + delta ) + this.y;

  this.context.beginPath();
  this.context.fillStyle = color;
  this.context.moveTo( x1, y1 ); // Top
  this.context.lineTo( x2, y2 ); // Bottom left
  this.context.quadraticCurveTo( x3, y3, x4, y4 ); // Bottom center
  this.context.lineTo( x4, y4 ); // Bottom right
  this.context.fill();
};

module.exports = Commit;
