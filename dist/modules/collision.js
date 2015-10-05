/*! springroll-utils 0.0.1 */
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
(function() {
	
	var Point = include("PIXI.Point", false) || include("createjs.Point", false);
	
	/**
	 * Utility functions for checking for collisions between shapes.
	 * @class CollisionUtils
	 */
	var CollisionUtils = {};
	
	//Polygon collision math / code borrowed from http://www.codeproject.com/Articles/15573/2D-Polygon-Collision-Detection
	//with understanding assisted by http://www.metanetsoftware.com/technique/tutorialA.html
	
	//Helper variables
	var _helperP = new Point(0,0);
	var minMaxA = {min:0, max:0};
	var minMaxB = {min:0, max:0};
	
	/**
	 * Checks two Polygons to see if they are intersecting.
	 * @method checkPolygonCollision
	 * @static
	 * @param {collison.Polygon} polyA The first polygon.
	 * @param {collison.Polygon} polyB The second polygon to check against the first.
	 * @return {Boolean} If the two polgons are intersecting.
	 */
	CollisionUtils.checkPolygonCollision = function(polyA, polyB)
	{
		if(polyA.aabbIsDirty)
			polyA.calcAABB();
		if(polyB.aabbIsDirty)
			polyB.calcAABB();
		//if the axis aligned bounding boxes don't interesct, the polygons definitely don't
		if(!polyA.aabb.intersects(polyB.aabb)) return false;
		
		var edgesA = polyA.edges;
		var edgeCountA = edgesA.length;
		//don't need to a full check of all 4 sides on a rectangle, since they are parallel and
		//thus on the same axis
		if(polyA.isRectangle)
			edgeCountA /= 2;
		var edgesB = polyB.edges;
		var edgeCountB = edgesB.length;
		//don't need to a full check of all 4 sides on a rectangle, since they are parallel and
		//thus on the same axis
		if(polyB.isRectangle)
			edgeCountB /= 2;
		var axis = _helperP;
		var edge;
		minMaxA.min = 0;
		minMaxA.max = 0;
		minMaxB.min = 0;
		minMaxB.max = 0;

		// Loop through all the edges of both polygons
		for (var edgeIndex = 0, len = edgeCountA + edgeCountB; edgeIndex < len; edgeIndex++)
		{
			edge = edgeIndex < edgeCountA ? edgesA[edgeIndex] : edgesB[edgeIndex - edgeCountA];
			
			// Find the axis perpendicular to the current edge
			axis.x = -edge.y;
			axis.y = edge.x;
			axis.normalize();

			// Find the projection of the polygon on the current axis
			projectPolygonToAxis(axis, polyA, minMaxA);
			projectPolygonToAxis(axis, polyB, minMaxB);
			
			var minA = minMaxA.min, maxA = minMaxA.max, minB = minMaxB.min, maxB = minMaxB.max;

			// Check if the polygon projections are currently intersecting
			//if (intervalDistance(minMaxA.min, minMaxA.max, minMaxB.min, minMaxB.max) > 0)
			var separation = minA < minB ? minB - maxA : minA - maxB;
			if(separation > 0)
				return false;
		}
		return true;
	};
	
	// Calculate the projection of a polygon on an axis
	// and returns it as a [min, max] interval
	var projectPolygonToAxis = function(axis, poly, out_MinMax)
	{
		var points = poly.points;
		var oX = poly.origin.x, oY = poly.origin.y, aX = axis.x, aY = axis.y;
		var p = points[0];
		var dotProd = dotProduct(p.x + oX, p.y + oY, aX, aY);
		var min = dotProd;
		var max = dotProd;
		for (var i = 1, len = points.length; i < len; i++)
		{
			p = points[i];
			dotProd = dotProduct(p.x + oX, p.y + oY, aX, aY);
			if (dotProd < min)
			{
				min = dotProd;
			}
			else if (dotProd > max)
			{
				max = dotProd;
			}
		}
		out_MinMax.min = min;
		out_MinMax.max = max;
	};
	
	/*
	 * Gets the dot product between two points. The math is p1.x * p2.x + p1.y * p2.y.
	 * @param {Number} p1X The x value of the first point.
	 * @param {Number} p1Y The y value of the first point.
	 * @param {Number} p2X The x value of the second point.
	 * @param {Number} p2Y The y value of the second point.
	 * @return {Number} The dot product of the two points.
	 */
	var dotProduct = function(p1X, p1Y, p2X, p2Y)
	{
		return p1X * p2X + p1Y * p2Y;
	};
	
	// Calculate the distance between [minA, maxA] and [minB, maxB]
	// The distance will be negative if the intervals overlap
	var intervalDistance = function(minA, maxA, minB, maxB)
	{
		return minA < minB ? minB - maxA : minA - maxB;
	};

	function rectIntersectsLineWithPoint(rect, x1, y1, x2, y2, outP)
	{
		return getLineIntersection(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.width, rect.y, outP) ||
			getLineIntersection(x1, y1, x2, y2, rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height, outP) ||
			getLineIntersection(x1, y1, x2, y2, rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height, outP) ||
			getLineIntersection(x1, y1, x2, y2, rect.x, rect.y + rect.height, rect.x, rect.y, outP);
	}

	//from
	//http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
	/**
	 * Determines if two line segments intersect, and if they do, can output the point of
	 * intersection.
	 * @method getLineIntersection
	 * @static
	 * @param  {Number} p0_x X position of the first point of the first line.
	 * @param  {Number} p0_y Y position of the first point of the first line.
	 * @param  {Number} p1_x X position of the second point of the first line.
	 * @param  {Number} p1_y Y position of the second point of the first line.
	 * @param  {Number} p2_x X position of the first point of the second line.
	 * @param  {Number} p2_y Y position of the first point of the second line.
	 * @param  {Number} p3_x X position of the second point of the second line.
	 * @param  {Number} p3_y Y position of the second point of the second line.
	 * @param  {Point} [outP] An optional point that will be set to the point of intersection.
	 * @return {Boolean} If there is actual intersection or not.
	 */
	CollisionUtils.getLineIntersection = function(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y,
		outP)
	{
		var s1_x, s1_y, s2_x, s2_y;
		s1_x = p1_x - p0_x;
		s1_y = p1_y - p0_y;
		s2_x = p3_x - p2_x;
		s2_y = p3_y - p2_y;

		var s, t;
		var divisor = 1 / (-s2_x * s1_y + s1_x * s2_y);
		s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) * divisor;
		t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) * divisor;

		if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
		{
			// Collision detected
			if (outP)
			{
				outP.x = p0_x + (t * s1_x);
				outP.y = p0_y + (t * s1_y);
			}
			return true;
		}

		return false; // No collision
	};
	
	/**
	 * Determines if a line segment intersects any of the lines that make a polygon. If it
	 * intersects multiple lines, then it returns the first point of intersection that was checked,
	 * rather than any particular one.
	 * @method getLineIntersection
	 * @static
	 * @param  {Number} p0_x X position of the first point of the first line.
	 * @param  {Number} p0_y Y position of the first point of the first line.
	 * @param  {Number} p1_x X position of the second point of the first line.
	 * @param  {Number} p1_y Y position of the second point of the first line.
	 * @param  {Polygon} poly The polygon to check against.
	 * @param  {Point} [outP] An optional point that will be set to the point of intersection.
	 * @return {Boolean} If there is actual intersection or not.
	 */
	CollisionUtils.getLinePolygonCollision = function(p0_x, p0_y, p1_x, p1_y, poly, outP)
	{
		if(poly.aabbIsDirty)
			poly.calcAABB();
		
		var points = poly.points;
		var oX = poly.origin.x, oY = poly.origin.y;
		var lastPoint = points[0];
		for(var i = points.length - 1; i >= 0; --i)
		{
			var p = points[i];
			if(CollisionUtils.getLineIntersection(p0_x, p0_y, p1_x, p1_y,
				oX + p.x, oY + p.y, oX + lastPoint.x, oY + lastPoint.y, outP))
			{
				return true;
			}
			lastPoint = p;
		}
		return false;
	};
	
	namespace('collision').CollisionUtils = CollisionUtils;
}());