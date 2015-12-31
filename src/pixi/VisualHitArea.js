(function() {
	
	var Rectangle = include("PIXI.Rectangle");
	var Circle = include("PIXI.Circle");
	var Ellipse = include("PIXI.Ellipse");
	var Polygon = include("PIXI.Polygon");
	var Sector = include("PIXI.Sector");
	var Graphics = include("PIXI.Graphics");
	
	var VisualHitArea = {};
	
	/**
	 * Adds a PIXI.Graphics to a container to reflect its hitArea property.
	 * @param  {PIXI.Container} target The display object with a valid hitArea property.
	 * @param  {uint} [color=0x00FF00] The color to draw the shape in.
	 */
	VisualHitArea.add = function(target, color)
	{
		if(!target || !target.hitArea || !target.hitArea.drawOnGraphics)
			return;
		if(!color)
			color = 0x00FF00;
		var hitArea = target.hitArea;
		var hit;
		if(target.__visHitArea)
		{
			hit = target.__visHitArea;
			hit.clear();
			hit.position.x = hit.position.y = 0;
			hit.scale.x = hit.scale.y = 1;
		}
		else
		{
			hit = new Graphics();
			target.__visHitArea = hit;
		}
		hitArea.drawOnGraphics(hit, color);
		target.addChild(hit);
	};
	
	//set up drawing functions for our default shapes
	Rectangle.prototype.drawOnGraphics = function(graphics, color)
	{
		graphics.lineStyle(1, color);
		graphics.drawRect(this.x, this.y, this.width, this.height);
	};
	
	Circle.prototype.drawOnGraphics = function(graphics, color)
	{
		graphics.lineStyle(1, color);
		graphics.drawCircle(this.x, this.y, this.radius);
	};
	
	Ellipse.prototype.drawOnGraphics = function(graphics, color)
	{
		graphics.lineStyle(1, color);
		graphics.drawEllipse(this.x, this.y, this.width, this.height);
	};
	
	Polygon.prototype.drawOnGraphics = function(graphics, color)
	{
		graphics.lineStyle(1, color);
		graphics.drawPolygon(this.points);
	};
	
	Sector.prototype.drawOnGraphics = function(graphics, color)
	{
		var RAD_TO_DEGREES = 180 / Math.PI;
		
		graphics.lineStyle(1, color);
		var x = this.x,
			y = this.y,
			radius = this.radius;
		var startX = x + Math.cos(this.startAngle * RAD_TO_DEGREES) * radius,
			startY = y + Math.sin(this.startAngle * RAD_TO_DEGREES) * radius,
			endX = x + Math.cos(this.endAngle * RAD_TO_DEGREES) * radius,
			endY = y + Math.sin(this.endAngle * RAD_TO_DEGREES) * radius;
		graphics.moveTo(startX, startY);
		graphics.lineTo(x, y);
		graphics.moveTo(endX, endY);
		graphics.arcTo(startX, startY, endX, endY, radius);
	};
	
	namespace('springroll.pixi').VisualHitArea = VisualHitArea;
}());