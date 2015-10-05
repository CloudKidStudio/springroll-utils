(function() {
	
	var Point = include("PIXI.Point", false) || include("createjs.Point", false),
		Rectangle = include("PIXI.Rectangle", false) || include("createjs.Rectangle", false);
	
	if(!Point || !Rectangle)
	{
		throw "collision.Polygon requires Point and Rectangle from either PIXI or createjs!";
	}
	
	if(!Rectangle.prototype.intersects)
	{
		Rectangle.prototype.intersects = function(rect)
		{
			return (rect.x <= this.x+this.width &&
				this.x <= rect.x+rect.width &&
				rect.y <= this.y+this.height &&
				this.y <= rect.y + rect.height);
		};
	}
	
	/**
	 * Polygon is a collision testing convex polygon for use with CollisionUtils.
	 * @class Polygon
	 * @constructor
	 * @param {Array} pointList The points marking the polygon corners.
	 * @param {Number} [scale=1] The scale of the polygon. pointList should be at a scale of 1, and
	 *						   then scale is applied to it.
	 * @param {Boolean} [isRectangle=false] If the shape is considered a rectangle (has 2 sets of
	 *									  parallel sides). Rectangles have some math that can be
	 *									  skipped for slightly faster hit testing.
	 */
	var Polygon = function(pointList, scale, isRectangle)
	{
		/**
		 * If the shape is considered a rectangle (has 2 sets of parallel sides).
		 * Rectangles have some math that can be skipped for slightly faster hit testing.
		 * @property {Boolean} isRectangle
		 */
		this.isRectangle = !!isRectangle;
		
		/**
		 * Rotation of polygon in degrees. This is used to keep track of current rotation in order
		 * to correctly rotate all points and edges.
		 * @property {Number} _curRotation;
		 * @private
		 * @readOnly
		 */
		this._curRotation = 0;
		
		/**
		 * Axis Aligned Bounding Box - used for optimization.
		 * @property {Rectangle} aabb
		 * @readOnly
		 * @private
		 */
		this.aabb = new Rectangle();
		
		/**
		 * If the AABB is dirty and should be recalculated the next time this polygon is hit tested.
		 * @property {Rectangle} aabb
		 * @readOnly
		 * @private
		 */
		this.aabbIsDirty = true;
		
		/**
		 * The origin of the polygon in collision-world space.
		 * @property {Point} origin
		 * @readOnly
		 * @private
		 */
		this.origin = new Point(0, 0);
		
		/**
		 * The origin of the polygon in collision-world space.
		 * @property {Point} origin
		 * @readOnly
		 * @private
		 */
		this._scale = 1;
		
		/**
		 * All of the points that make up this polygon.
		 * @property {Array} points
		 * @readOnly
		 * @private
		 */
 		this.points = [];
		
		/**
		 * All of the edges from point to the following point.
		 * @property {Array} edges
		 * @readOnly
		 * @private
		 */
		this.edges = [];
		
		var prevPoint = null;
		var point;
		//go through the points and set up points and edges
		for(var i = 0, len = pointList.length; i < len; ++i)
		{
			point = pointList[i];
			if(prevPoint)
			{
				this.edges.push(new Point(point.x - prevPoint.x, point.y - prevPoint.y));
			}
			this.points.push(new Point(point.x, point.y));
			
			prevPoint = point;
		}
		//add the final edge to connect the start to the end
		point = pointList[0];
		this.edges.push(new Point(point.x - prevPoint.x, point.y - prevPoint.y));
		
		//set the initial scale
		if(scale && typeof scale == "number")
			this.scale = scale;
	};
	
	var p = Polygon.prototype = {};
	
	/**
	 * The current scale from the original points given. Note that setting this
	 * does have a performance penalty, as it recaclulates all of the points and
	 * edges in the polygon.
	 * @property {Number} scale
	 */
	Object.defineProperty(p, "scale", {
		get: function() { return this._scale; },
		set: function(value)
		{
			//ensure that the scale has changed and is not NaN
			if(value == this._scale || value != value) return;
			
			//determine what value we need to scale by to hit the target scale
			var scaleVal = value / this._scale;
			this._scale = value;
			
			var i, len, p, prevP, points = this.points, e, edges = this.edges;
			for(i = 0, len = points.length; i < len; ++i)
			{
				p = points[i];
				var xnew = p.x * scaleVal;
				var ynew = p.y * scaleVal;
				p.x = xnew;
				p.y = ynew;
				
				if(prevP)
				{
					e = edges[i - 1];
					e.x = xnew - prevP.x;
					e.y = ynew - prevP.y;
				}
				
				prevP = p;
			}
			//do the final edge
			p = points[0];
			e = edges[i - 1];
			e.x = p.x - prevP.x;
			e.y = p.y - prevP.y;
			this.aabbIsDirty = true;
		}
	});
	
	var DEG_TO_RADS = Math.PI / 180;
	
	/**
	 * The current rotation in world space of this polygon. Note that setting this
	 * does have a performance penalty, as it recaclulates all of the points and
	 * edges in the polygon.
	 * @property {Number} rotation
	 */
	Object.defineProperty(p, "rotation", {
		get: function() { return this._curRotation; },
		set: function(value)
		{
			//ensure that the rotation has changed and is not NaN
			if(value == this._curRotation || value != value) return;
			
			var i, len, p, prevP, points = this.points, e, edges = this.edges;
			var rotationDifference = (newRotation - this._curRotation) * DEG_TO_RADS;
			this._curRotation = newRotation;
			var s = Math.sin(rotationDifference);
			var c = Math.cos(rotationDifference);
			
			for(i = 0, len = points.length; i < len; ++i)
			{
				p = points[i];
				//counterclockwise angle - math standard, seems to be correct for our purposes
				var xnew = p.x * c - p.y * s;
				var ynew = p.x * s + p.y * c;
				/*
				//clockwise angle
				var xnew = p.x * c + p.y * s;
				var ynew = -p.x * s + p.y * c;
				*/
				p.x = xnew;
				p.y = ynew;
				
				if(prevP)
				{
					e = edges[i - 1];
					e.x = xnew - prevP.x;
					e.y = ynew - prevP.y;
				}

				prevP = p;
			}
			//do the final edge
			p = points[0];
			e = edges[i - 1];
			e.x = p.x - prevP.x;
			e.y = p.y - prevP.y;
			
			this.aabbIsDirty = true;
		}
	});
	
	/**
	 * Recalculates the Axis Aligned Bounding Box of the polygon.
	 * @method calcAABB
	 */
	p.calcAABB = function()
	{
		var aabb = this.aabb, points = this.points, p, i, length, origin = this.origin;
		var xMin = Infinity;
		var xMax = -Infinity;
		var yMin = Infinity;
		var yMax = -Infinity;
		for(i = 0, length = points.length; i < length; ++i)
		{
			p = points[i];
			var x = p.x;
			var y = p.y;
			if(x < xMin)
				xMin = x;
			if(x > xMax)
				xMax = x;
			if(y < yMin)
				yMin = y;
			if(y > yMax)
				yMax = y;
		}
		aabb.x = xMin + origin.x;
		aabb.y = yMin + origin.y;
		aabb.width = xMax - xMin;
		aabb.height = yMax - yMin;
	};
	
	/**
	 * Updates the origin of the polygon in collision-world space.
	 * @method updateOrigin
	 * @param {Number} newX
	 * @param {Number} newY
	 */
	p.updateOrigin = function(newX, newY)
	{
		this.origin.x = newX;
		this.origin.y = newY;
		
		this.aabbIsDirty = true;
	};
	
	/**
	 * Resets the origin and rotation of this polygon.
	 * @method resetPositioning
	 */
	p.resetPositioning = function()
	{
		this.origin.x = this.origin.y = 0;
		this.rotation = 0;
		this.aabbIsDirty = true;
	};
	
	/**
	 * Checks if the x, and y coords passed to this function are contained within this polygon
	 *
	 * @method contains
	 * @param x {Number} The X coord of the point to test
	 * @param y {Number} The Y coord of the point to test
	 * @return {Boolean} if the x/y coords are within this polygon
	 */
	p.contains = function(x, y)
	{
		var inside = false;

		// use some raycasting to test hits
		// https://github.com/substack/point-in-polygon/blob/master/index.js
		var p = this.points;

		var pi, pj, xi, yi, xj, yj, intersect;
		for (var i = 0, len = p.length, j = p.length - 1; i < len; j = i++)
		{
			 pi = p[i];
			 pj = p[j];
			 xi = pi.x;
			 yi = pi.y;
			 xj = pj.x;
			 yj = pj.y;
			 intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

			if(intersect) inside = !inside;
		}

		return inside;
	};
	
	p.toString = function()
	{
		return "[collision.Polygon - points: " + this.points.join(",") + "]";
	};
	
	/**
	 * Nulls the references to the origin, edges, and points.
	 * @method destroy
	 */
	p.destroy = function()
	{
		this.origin = this.edges = this.points = null;
	};
	
	/**
	 * Generates a Polygon from a circle.
	 * @method fromCircle
	 * @static
	 * @param {Object} circle The circle data object.
	 * @param {Number} circle.x The x position of the circle's center.
	 * @param {Number} circle.y The y position of the circle's center.
	 * @param {Number} circle.radius|circle.r The radius of the circle.
	 * @param {Number} [numPoints=4] Number of points to use. More points means more accuracy, but
	 *							   worse performance. Minimum is 4.
	 * @return {Polygon} The generated polygon.
	 */
	Polygon.fromCircle = function(circle, numPoints)
	{
		if(numPoints >= 4)
		{
			//do nothing
		}
		else
		{
			numPoints = 4;
		}
		var x = circle.x;
		var y = circle.y;
		var radius = circle.radius || circle.r || 1;
		var radians = Math.PI * 2 / numPoints;
		var pointList = [];
		for(var i = 0; i < numPoints; ++i)
		{
			pointList.push(
			{
				x: x + Math.cos(radians * i) * radius,
				y: y + Math.sin(radians * i) * radius
			});
		}
		return new Polygon(pointList, 1, numPoints == 4);
	};
	
	/**
	 * Generates a Polygon from a ellipse.
	 * @method fromEllipse
	 * @static
	 * @param {Object} ellipse The ellipse data object.
	 * @param {Number} ellipse.x The x position of the ellipse's center.
	 * @param {Number} ellipse.y The y position of the ellipse's center.
	 * @param {Number} ellipse.width|ellipse.w The width of the ellipse.
	 * @param {Number} ellipse.height|ellipse.h The height of the ellipse.
	 * @param {Number} [numPoints=6] Number of points to use. More points means more accuracy, but
	 *							   worse performance. Minimum is 4.
	 * @return {Polygon} The generated polygon.
	 */
	Polygon.fromEllipse = function(ellipse, numPoints)
	{
		if(numPoints >= 4)
		{
			//do nothing
		}
		else
		{
			numPoints = 6;
		}
		var x = ellipse.x;
		var y = ellipse.y;
		var width = (ellipse.width || ellipse.w) / 2;
		var height = (ellipse.height || ellipse.h) / 2;
		var radians = Math.PI * 2 / numPoints;
		var pointList = [];
		for(var i = 0; i < numPoints; ++i)
		{
			pointList.push(
			{
				x: x + Math.cos(radians * i) * width,
				y: y + Math.sin(radians * i) * height
			});
		}
		return new Polygon(pointList, 1, numPoints == 4);
	};
	
	/**
	 * Generates a Polygon from a rectangle.
	 * @method fromRect
	 * @static
	 * @param {Object} rect The rectangle to generate a polygon from.
	 * @param {Number} rect.x The position of the left side of the rectangle.
	 * @param {Number} rect.y The position of the upper side of the rectangle.
	 * @param {Number} rect.width|rect.w The width of the rectangle.
	 * @param {Number} rect.height|rect.h The height of the rectangle.
	 * @return {Polygon} The generated polygon.
	 */
	Polygon.fromRect = function(rect)
	{
		var x = rect.x;
		var y = rect.y;
		var width = rect.width || rect.w;
		var height = rect.height || rect.h;
		var pointList =
		[
			{
				x: x,
				y: y
			},
			{
				x: x + width,
				y: y
			},
			{
				x: x + width,
				y: y + height
			},
			{
				x: x,
				y: y + height
			}
		];
		return new Polygon(pointList, 1, true);
	};
	
	namespace('collision').Polygon = Polygon;
}());