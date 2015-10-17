(function() {
	
	var Container = include("PIXI.Container");
	var Graphics = include("PIXI.Graphics");
	
	var List = function()
	{
		Container.call(this);
		
		this.content = new Container();
		this.addChild(this.content);
		
		this.items = [];
		
		this.orientation = "horizontal";
		
		this.horizontalSpacing = 0;
		this.verticalSpacing = 0;
		
		this.itemsPerRow = 1;
		this.itemsPerColumn = 1;
		
		this.listWidth = 0;
		this.listHeight = 0;
		
		this.maxScroll = 0;
		this.listViewArea = 0;
	};
	
	var p = extend(List, Container);
	var s = Container.prototype;
	
	p.setMask = function(maskOrWidth, height)
	{
		var mask;
		if(typeof maskOrWidth == "number" && typeof height == "number")
		{
			mask = new Graphics();
			mask.beginFill(0, 1);
			mask.drawRect(0, 0, maskOrWidth, height);
			mask.endFill();
			
			if(this.orientation == "vertical")
			{
				this.listViewArea = height;
				this.maxScroll = this.listHeight - height;
			}
			else
			{
				this.listViewArea = maskOrWidth;
				this.maxScroll = this.listWidth - maskOrWidth;
			}
		}
		else
			mask = maskOrWidth || null;
		
		if(this.maskObj)
		{
			this.removeChild(this.maskObj);
		}
		
		this.content.mask = mask;
		this.addChild(mask);
		this.maskObj = mask;
	};
	
	Object.defineProperty(p, "scroll", {
		get: function()
		{
			if(this.orientation == "vertical")
				return -this.content.x;
			else
				return -this.content.y;
		},
		set: function(value)
		{
			if(value < 0)
				value = 0;
			else if(value > this.maxScroll)
				value = this.maxScroll;
			if(this.orientation == "vertical")
				this.content.x = -value;
			else
				this.content.y = -value;
		}
	});
	
	Object.defineProperty(p, "scrollPercent", {
		get: function()
		{
			if(this.orientation == "vertical")
				return -this.content.x / this.maxScroll;
			else
				return -this.content.y / this.maxScroll;
		},
		set: function(value)
		{
			if(value < 0)
				value = 0;
			else if(value > this.maxScroll)
				value = this.maxScroll;
			value *= -maxScroll;
			if(this.orientation == "vertical")
				this.content.x = value;
			else
				this.content.y = value;
		}
	});
	
	p.addItem = function(item)
	{
		if(this.items.indexOf(item) >= 0) return;
		
		this.items.push(item);
		this.content.addChild(item);
		
		this.updateOrder();
	};
	
	p.updateOrder = function()
	{
		this.listWidth = 0;
		this.listHeight = 0;
		
		var nextX = 0, nextY = 0;
		var items = this.items;
		for(var i = 0, length = items.length; i < length; ++i)
		{
			var item = items[i];
			item.x = nextX;
			item.y = nextY;
			
			var itemBounds = item.getLocalBounds().clone();
			itemBounds.width *= item.scale.x;
			itemBounds.height *= item.scale.y;
			if(item.x + itemBounds.width > this.listWidth)
				this.listWidth = item.x + itemBounds.width;
			if(item.y + itemBounds.height > this.listHeight)
				this.listHeight = item.y + itemBounds.height;
			
			if(this.orientation == "horizontal")
			{
				if (i % this.itemsPerColumn == this.itemsPerColumn - 1)
				{
					nextY = 0;
					nextX += itemBounds.width + this.horizontalSpacing;
				}
				else
				{
					nextY += itemBounds.height + this.verticalSpacing;
				}
			}
			else
			{
				if (i % this.itemsPerRow == this.itemsPerRow - 1)
				{
					nextX = 0;
					nextY += itemBounds.height + this.verticalSpacing;
				}
				else
				{
					nextX += itemBounds.width + this.horizontalSpacing;
				}
			}
		}
		
		if(this.orientation == "horizontal")
			this.maxScroll = this.listWidth - this.listViewArea;
		else
			this.maxScroll = this.listHeight - this.listViewArea;
		
		this.emit("resize", this.listWidth, this.listHeight);
	};
	
	p.removeItem = function(item, skipResize)
	{
		var index = this.items.indexOf(item);
		if(index == -1) return;
		
		this.items.splice(index, 1);
		this.content.removeChild(item);
		
		if(!skipResize)
		{
			this.updateOrder();
			this.emit("resize", this.listWidth, this.listHeight);
		}
		
		this.emit("itemRemoved", item);
	};
	
	p.removeAllItems = function()
	{
		for(var i = this.items.length - 1; i >= 0; --i)
			this.removeItem(this.items[i], true);
		
		this.listWidth = this.listHeight = 0;
		
		this.emit("resize", this.listWidth, this.listHeight);
	};
	
	p.destroy = function()
	{
		s.destroy.call(this);
		
		this.content.destroy();
		
		this.content = this.items = null;
	};
	
	namespace('springroll.pixi').List = List;
}());