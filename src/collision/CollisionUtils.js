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