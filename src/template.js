var utils = require( "./utils" );

/**
 * Template
 *
 * @constructor
 *
 * @param {Object} options - Template options
 * @param {Array} [options.colors] - Colors scheme: One color for each column
 * @param {String} [options.arrow.color] - Arrow color
 * @param {Number} [options.arrow.size] - Arrow size
 * @param {Number} [options.arrow.offser] - Arrow offset
 * @param {String} [options.branch.color] - Branch color
 * @param {Number} [options.branch.linewidth] - Branch line width
 * @param {String} [options.branch.mergeStyle = ("bezier"|"straight")] - Branch merge style
 * @param {Number} [options.branch.spacingX] - Space between branchs
 * @param {Number} [options.branch.spacingY] - Space between branchs
 * @param {Number} [options.commit.spacingX] - Space between commits
 * @param {Number} [options.commit.spacingY] - Space between commits
 * @param {String} [options.commit.color] - Master commit color (dot & message)
 * @param {String} [options.commit.dot.color] - Commit dot color
 * @param {Number} [options.commit.dot.size] - Commit dot size
 * @param {Number} [options.commit.dot.strokewidth] - Commit dot stroke width
 * @param {Number} [options.commit.dot.strokeColor] - Commit dot stroke color
 * @param {String} [options.commit.message.color] - Commit message color
 * @param {Boolean} [options.commit.message.display] - Commit display policy
 * @param {Boolean} [options.commit.message.displayAuthor] - Commit message author policy
 * @param {Boolean} [options.commit.message.displayHash] - Commit message hash policy
 * @param {String} [options.commit.message.font = "normal 12pt Calibri"] - Commit message font
 *
 * @this Template
 **/
function Template ( options ) {
  // Options
  options = (typeof options === "object") ? options : {};
  options.branch = options.branch || {};
  options.arrow = options.arrow || {};
  options.commit = options.commit || {};
  options.commit.dot = options.commit.dot || {};
  options.commit.message = options.commit.message || {};

  // One color per column
  this.colors = options.colors || [ "#6963FF", "#47E8D4", "#6BDB52", "#E84BA5", "#FFA657" ];

  // Branch style
  this.branch = {};
  this.branch.color = options.branch.color || null; // Only one color
  this.branch.lineWidth = options.branch.lineWidth || 2;
  this.branch.lineDash = options.branch.lineDash || [];

  // Merge style = "bezier" | "straight"
  this.branch.mergeStyle = options.branch.mergeStyle || "bezier";

  // Space between branchs
  this.branch.spacingX = (typeof options.branch.spacingX === "number") ? options.branch.spacingX : 20;
  this.branch.spacingY = options.branch.spacingY || 0;

  // Arrow style
  this.arrow = {};
  this.arrow.size = options.arrow.size || null;
  this.arrow.color = options.arrow.color || null;
  this.arrow.active = typeof (this.arrow.size) === "number";
  this.arrow.offset = options.arrow.offset || 2;

  // Commit style
  this.commit = {};
  this.commit.spacingX = options.commit.spacingX || 0;
  this.commit.spacingY = (typeof options.commit.spacingY === "number") ? options.commit.spacingY : 25;

  // Only one color, if null message takes branch color (full commit)
  this.commit.color = options.commit.color || null;

  this.commit.dot = {};

  // Only one color, if null message takes branch color (only dot)
  this.commit.dot.color = options.commit.dot.color || null;
  this.commit.dot.size = options.commit.dot.size || 3;
  this.commit.dot.strokeWidth = options.commit.dot.strokeWidth || null;
  this.commit.dot.strokeColor = options.commit.dot.strokeColor || null;

  this.commit.message = {};
  this.commit.message.display = utils.booleanOptionOr( options.commit.message.display, true );
  this.commit.message.displayAuthor = utils.booleanOptionOr( options.commit.message.displayAuthor, true );
  this.commit.message.displayHash = utils.booleanOptionOr( options.commit.message.displayHash, true );

  // Only one color, if null message takes commit color (only message)
  this.commit.message.color = options.commit.message.color || null;
  this.commit.message.font = options.commit.message.font || "normal 12pt Calibri";
}

/**
 * Get a default template from library
 *
 * @param {String} name - Template name
 *
 * @return {Template} [template] - Template if exist
 **/
Template.prototype.get = function ( name ) {
  var template = {};

  switch ( name ) {
  case "blackarrow":
    template = {
      branch: {
        color: "#000000",
        lineWidth: 4,
        spacingX: 50,
        mergeStyle: "straight"
      },
      commit: {
        spacingY: -60,
        dot: {
          size: 12,
          strokeColor: "#000000",
          strokeWidth: 7
        },
        message: {
          color: "black"
        }
      },
      arrow: {
        size: 16,
        offset: 2.5
      }
    };
    break;

  case "metro":
    /* falls through */
  default:
    template = {
      colors: [ "#979797", "#008fb5", "#f1c109" ],
      branch: {
        lineWidth: 10,
        spacingX: 50
      },
      commit: {
        spacingY: -80,
        dot: {
          size: 14
        },
        message: {
          font: "normal 14pt Arial"
        }
      }
    };
    break;
  }

  return new Template( template );
};

module.exports = Template;
