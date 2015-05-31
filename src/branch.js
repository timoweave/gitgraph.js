var Commit = require( "./commit" );

/**
 * Branch
 *
 * @constructor
 *
 * @param {Object} options - Options of branch
 * @param {GitGraph} options.parent - Instance of GitGraph
 * @param {Branch} [options.parentBranch] - Parent branch
 * @param {String} [options.name = "no-name"] - Branch name
 *
 * @this Branch
 **/
function Branch ( options ) {
  // Options
  options = (typeof options === "object") ? options : {};
  this.parent = options.parent;
  this.parentBranch = options.parentBranch;
  this.name = (typeof options.name === "string") ? options.name : "no-name";
  this.context = this.parent.context;
  this.template = this.parent.template;
  this.lineWidth = options.lineWidth || this.template.branch.lineWidth;
  this.lineDash = options.lineDash || this.template.branch.lineDash;
  this.spacingX = this.template.branch.spacingX;
  this.spacingY = this.template.branch.spacingY;
  this.size = 0;
  this.height = 0;
  this.width = 0;
  this.commits = [];
  this.path = []; // Path to draw, this is an array of points {x, y, type("start"|"join"|"end")}

  // Column number calculation for auto-color & auto-offset
  this.column = 0;
  this.calculColumn();

  // Options with auto value
  this.offsetX = this.column * this.spacingX;
  this.offsetY = this.column * this.spacingY;

  this.color = options.color || this.template.branch.color || this.template.colors[ this.column ];

  // Checkout on this new branch
  this.checkout();
}

/**
 * Create new branch
 *
 * @param {(String | Object)} options - Branch name | Options of Branch
 *
 * @see Branch
 * @this Branch
 *
 * @return {Branch} New Branch
 **/
Branch.prototype.branch = function ( options ) {
  // Options
  if ( typeof options === "string" ) {
    var name = options;
    options = {};
    options.name = name;
  }

  options = (typeof options === "object") ? options : {};
  options.parent = this.parent;
  options.parentBranch = options.parentBranch || this;

  // Add branch
  var branch = new Branch( options );
  this.parent.branchs.push( branch );

  // Return
  return branch;
};

/**
 * Render the branch
 *
 * @this Branch
 **/
Branch.prototype.render = function () {
  this.context.beginPath();

  for ( var i = 0, point; !!(point = this.path[ i ]); i++ ) {
    if ( point.type === "start" ) {
      this.context.moveTo( point.x, point.y );
    } else {
      if ( this.template.branch.mergeStyle === "bezier" ) {
        var path = this.path[ i - 1 ];

        this.context.bezierCurveTo(
          path.x - this.template.commit.spacingX / 2, path.y - this.template.commit.spacingY / 2,
          point.x + this.template.commit.spacingX / 2, point.y + this.template.commit.spacingY / 2,
          point.x, point.y
        );
      } else {
        this.context.lineTo( point.x, point.y );
      }
    }
  }

  this.context.lineWidth = this.lineWidth;
  this.context.strokeStyle = this.color;
  if ( this.context.setLineDash !== undefined ) {
    this.context.setLineDash( this.lineDash );
  }
  this.context.stroke();
  this.context.closePath();
};

/**
 * Add a commit
 *
 * @param {(String | Object)} [options] - Message | Options of commit
 * @param {String} [options.detailId] - Id of detail DOM Element
 *
 * @see Commit
 *
 * @this Branch
 **/
Branch.prototype.commit = function ( options ) {
  if ( typeof (options) === "string" ) {
    var message = options;
    options = { message: message };
  } else if ( typeof (options) !== "object" ) {
    options = {};
  }

  options.arrowDisplay = this.template.arrow.active;
  options.branch = this;
  options.color = options.color || this.template.commit.color || this.template.colors[ this.column ];
  options.parent = this.parent;
  options.parentCommit = options.parentCommit || this.commits.slice( -1 )[ 0 ];

  // Special compact mode
  if ( this.parent.mode === "compact"
       && this.parent.commits.slice( -1 )[ 0 ]
       && this.parent.commits.slice( -1 )[ 0 ].branch !== options.branch
       && options.branch.commits.length
       && options.type !== "mergeCommit" ) {
    this.parent.commitOffsetX -= this.template.commit.spacingX;
    this.parent.commitOffsetY -= this.template.commit.spacingY;
  }

  options.messageColor = options.messageColor || options.color || this.template.commit.message.color || null;
  options.dotColor = options.dotColor || options.color || this.template.commit.dot.color || null;
  options.x = this.offsetX - this.parent.commitOffsetX;
  options.y = this.offsetY - this.parent.commitOffsetY;

  // Detail
  var isVertical = this.parent.orientation === "vertical";
  var isNotCompact = this.parent.mode !== "compact";
  if ( typeof options.detailId === "string" && isVertical && isNotCompact ) {
    options.detail = document.getElementById( options.detailId );
  } else {
    options.detail = null;
  }

  // Check collision (Cause of special compact mode)
  var previousCommit = options.branch.commits.slice( -1 )[ 0 ] || {};
  var commitPosition = options.x + options.y;
  var previousCommitPosition = previousCommit.x + previousCommit.y;
  var isCommitAtSamePlaceThanPreviousOne = (commitPosition === previousCommitPosition);

  if ( isCommitAtSamePlaceThanPreviousOne ) {
    this.parent.commitOffsetX += this.template.commit.spacingX;
    this.parent.commitOffsetY += this.template.commit.spacingY;
    options.x = this.offsetX - this.parent.commitOffsetX;
    options.y = this.offsetY - this.parent.commitOffsetY;
  }

  // Fork case: Parent commit from parent branch
  if ( options.parentCommit instanceof Commit === false && this.parentBranch instanceof Branch ) {
    options.parentCommit = this.parentBranch.commits.slice( -1 )[ 0 ];
  }

  var commit = new Commit( options );
  this.commits.push( commit );

  // Add point(s) to path
  var point = {
    x: commit.x,
    y: commit.y,
    type: "join"
  };

  // First commit
  var isFirstBranch = commit.parentCommit instanceof Commit;
  var isPathBeginning = this.path.length === 0;
  if ( isFirstBranch && isPathBeginning ) {
    var parent = {
      x: commit.parentCommit.branch.offsetX - this.parent.commitOffsetX + this.template.commit.spacingX,
      y: commit.parentCommit.branch.offsetY - this.parent.commitOffsetY + this.template.commit.spacingY,
      type: "start"
    };
    this.path.push( JSON.parse( JSON.stringify( parent ) ) ); // Elegant way for cloning an object
    parent.type = "join";
    this.parentBranch.path.push( parent );
  } else if ( isPathBeginning ) {
    point.type = "start";
  }
  this.path.push( point );

  // Increment commitOffset for next commit position
  this.parent.commitOffsetX += this.template.commit.spacingX;
  this.parent.commitOffsetY += this.template.commit.spacingY;

  // Add height of detail div (normal vertical mode only)
  if ( commit.detail !== null ) {
    commit.detail.style.display = "block";
    this.parent.commitOffsetY -= commit.detail.clientHeight - 40;
  }

  // Auto-render
  this.parent.render();

  // Return the main object so we can chain
  return this;
};

/**
 * Checkout onto this branch
 *
 * @this Branch
 **/
Branch.prototype.checkout = function () {
  this.parent.HEAD = this;
};

/**
 * Delete this branch
 *
 * @this Branch
 **/
Branch.prototype.delete = function () {
  this.isfinish = true;
};

/**
 * Merge branch
 *
 * @param {Branch} [target = this.parent.HEAD]
 * @param {(String | Object)} [commitOptions] - Message | Options of commit
 *
 * @this Branch
 *
 * @return {Branch} this
 **/
Branch.prototype.merge = function ( target, commitOptions ) {
  // Merge target
  var targetBranch = target || this.parent.HEAD;

  // Check integrity of target
  if ( targetBranch instanceof Branch === false || targetBranch === this ) {
    return;
  }

  // Merge commit
  var defaultMessage = "Merge branch `" + this.name + "` into `" + targetBranch.name + "`";
  if ( typeof commitOptions !== "object" ) {
    var message = commitOptions;
    commitOptions = {};
    commitOptions.message = (typeof message === "string") ? message : defaultMessage;
  } else {
    commitOptions.message = commitOptions.message || defaultMessage;
  }
  commitOptions.type = "mergeCommit";
  commitOptions.parentCommit = this.commits.slice( -1 )[ 0 ];

  targetBranch.commit( commitOptions );

  // Add points to path
  var endOfBranch = {
    x: this.offsetX + this.template.commit.spacingX * 2 - this.parent.commitOffsetX,
    y: this.offsetY + this.template.commit.spacingY * 2 - this.parent.commitOffsetY,
    type: "join"
  };
  this.path.push( JSON.parse( JSON.stringify( endOfBranch ) ) ); // Elegant way for cloning an object

  var mergeCommit = {
    x: targetBranch.commits.slice( -1 )[ 0 ].x,
    y: targetBranch.commits.slice( -1 )[ 0 ].y,
    type: "end"
  };
  this.path.push( mergeCommit );

  endOfBranch.type = "start";
  this.path.push( endOfBranch ); // End of branch for future commits

  // Auto-render
  this.parent.render();

  // Checkout on target
  this.parent.HEAD = targetBranch;

  // Return the main object so we can chain
  return this;
};

/**
 * Calcul column
 *
 * @this Branch
 **/
Branch.prototype.calculColumn = function () {
  for ( var i = 0, branch; !!(branch = this.parent.branchs[ i ]); i++ ) {
    if ( !branch.isfinish ) {
      this.column++;
    } else {
      break;
    }
  }

  this.parent.columnMax = (this.column > this.parent.columnMax) ? this.column : this.parent.columnMax;
};

module.exports = Branch;
