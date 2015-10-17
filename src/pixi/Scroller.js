(function() {
	
	var Container = include("PIXI.Container");
	var Texture = include("PIXI.Texture");
	var Rectangle = include("PIXI.Rectangle");
	var DragManager = include("springroll.pixi.DragManager");
	var Application = include("springroll.Application");
	var Slice3Sprite;
	var Slice3Textures;
	
	var Scroller = function(areaConfig, tabConfig, target)
	{
		if(!Slice3Sprite)
		{
			Slice3Sprite = include("springroll.pixi.Slice3Sprite");
			Slice3Textures = include("springroll.pixi.Slice3Textures");
		}
		
		Container.call(this);
		
		this.onListResize = this.onListResize.bind(this);
		this.onAreaDown = this.onAreaDown.bind(this);
		this.onAreaUp = this.onAreaUp.bind(this);
		this.onAreaUpOutside = this.onAreaUpOutside.bind(this);
		this.onAreaOver = this.onAreaOver.bind(this);
		this.onAreaOut = this.onAreaOut.bind(this);
		this.onTabDown = this.onTabDown.bind(this);
		this.onTabUp = this.onTabUp.bind(this);
		this.onTabUpOutside = this.onTabUpOutside.bind(this);
		this.onTabOver = this.onTabOver.bind(this);
		this.onTabOut = this.onTabOut.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.update = this.update.bind(this);
		
		this.areaTextures = {};
		this.areaStates = {};
		this.tabTextures = {};
		this.tabStates = {};
		
		this.area = new Container();
		this.addChild(this.area);
		this.tab = new Container();
		this.addChild(this.tab);
		this.area.interactiveChildren = this.tab.interactiveChildren = false;
		
		this.tabSize = 0;
		this.minTabSize = 0;
		this.areaSize = 0;
		
		var state;
		for(state in areaConfig.states)
		{
			this.areaTextures[state] = new Slice3Textures(areaConfig[state], areaConfig.sliceData);
			var area = this.areaStates[state] = new Slice3Sprite(this.areaTextures[state]);
			this.area.addChild(area);
			
			if(areaConfig.height)
			{
				area.setHeight(areaConfig.height);
			}
			else if(areaConfig.width)
			{
				area.setWidth(areaConfig.width);
			}
		}
		
		if(areaConfig.height)
		{
			this.areaSize = areaConfig.height;
		}
		else if(areaConfig.width)
		{
			this.areaSize = areaConfig.width;
		}
		this.tabPadding = areaConfig.tabPadding;
		
		for(state in tabConfig.states)
		{
			this.tabTextures[state] = new Slice3Textures(tabConfig[state], tabConfig.sliceData);
			var tab = this.tabStates[state] = new Slice3Sprite(this.tabTextures[state]);
			this.tab.addChild(tab);
		}
		
		this.tabSize = tabConfig.size;
		
		this.minTabPos = tabConfig.minPos;
		this.maxTabPos = this.areaSize - tabConfig.minPos - this.tabSize;
		
		this.dragManager = new DragManager(this.onDragStart, this.onDragEnd);
		
		this._tabBounds = new Rectangle();
		this.dragManager.addObject(this.tab, this._tabBounds);
		this.tab.enableDrag();
		
		this.target = target || null;
		this._areaOver = false;
		this._areaDown = false;
		this._tabOver = false;
		this._tabDown = false;
	};
	
	var p = extend(Scroller, Container);
	var s = Container.prototype;
	
	Object.defineProperty(p, "enabled", {
		get: function() { return this._enabled; },
		set: function(value)
		{
			this._enabled = !!value;
			
			var tab = this.tab, area = this.area;
			
			area.interactive = tab.interactive = area.buttonMode = tab.buttonMode = this._enabled;
			
			tab.off("mousedown", this.onTabDown);
			tab.off("touchstart", this.onTabDown);
			tab.off("mouseup", this.onTabUp);
			tab.off("touchend", this.onTabUp);
			tab.off("mouseupoutside", this.onTabUpOutside);
			tab.off("touchendoutside", this.onTabUpOutside);
			tab.off("mouseover", this.onTabOver);
			tab.off("mouseout", this.onTabOut);
			area.off("mousedown", this.onAreaDown);
			area.off("touchstart", this.onAreaDown);
			area.off("mouseup", this.onAreaUp);
			area.off("touchend", this.onAreaUp);
			area.off("mouseupoutside", this.onAreaUpOutside);
			area.off("touchendoutside", this.onAreaUpOutside);
			area.off("mouseover", this.onAreaOver);
			area.off("mouseout", this.onAreaOut);
			
			if(value)
			{
				tab.on("mousedown", this.onTabDown);
				tab.on("touchstart", this.onTabDown);
				tab.on("mouseup", this.onTabUp);
				tab.on("touchend", this.onTabUp);
				tab.on("mouseupoutside", this.onTabUpOutside);
				tab.on("touchendoutside", this.onTabUpOutside);
				if(this.tabStates.over)
				{
					tab.on("mouseover", this.onTabOver);
					tab.on("mouseout", this.onTabOut);
				}
				area.on("mousedown", this.onAreaDown);
				area.on("touchstart", this.onAreaDown);
				area.on("mouseup", this.onAreaUp);
				area.on("touchend", this.onAreaUp);
				area.on("mouseupoutside", this.onAreaUpOutside);
				area.on("touchendoutside", this.onAreaUpOutside);
				if(this.areaStates.over)
				{
					area.on("mouseover", this.onAreaOver);
					area.on("mouseout", this.onAreaOut);
				}
			}
			
			this._updateAreaState();
			this._updateTabState();
		}
	});
	
	Object.defineProperty(p, "target", {
		get: function() { return this._target; },
		set: function(value)
		{
			if(this._target)
			{
				this._target.off("resize", this.onListResize);
			}
			this._target = value;
			if(value)
			{
				var _tabBounds = this._tabBounds;
				if(value.orientation == "vertical")
				{
					_tabBounds.x = _tabBounds.width = _tabBounds.right = 0;
					_tabBounds.y = this.minTabPos;
					_tabBounds.height = this.maxTabPos - this.minTabPos;
					_tabBounds.bottom = _tabBounds.y + _tabBounds.height;
				}
				else
				{
					_tabBounds.y = _tabBounds.height = _tabBounds.bottom = 0;
					_tabBounds.x = this.minTabPos;
					_tabBounds.width = this.maxTabPos - this.minTabPos;
					_tabBounds.right = _tabBounds.x + _tabBounds.width;
				}
				value.on("resize", this.onListResize);
				this.onListResize(value.listWidth, value.listHeight);
				this.enabled = true;
			}
			else
				this.enabled = false;
		}
	});
	
	p._updateAreaState = function()
	{
		var areaStates = this.areaStates;
		//hide all states
		for(var state in areaStates)
			areaStates[state].visible = false;
		//figure out which state is active
		var activeState;
		if(!this._enabled)
			activeState = areaStates.disabled;
		else if(this._areaDown)
			activeState = areaStates.down;
		else if(this._areaOver)
			activeState = areaStates.over;
		if(!activeState)
			activeState = areaStates.up;
		//show active state
		activeState.visible = true;
	};
	
	p._updateTabState = function()
	{
		var tabStates = this.tabStates;
		//hide all states
		for(var state in tabStates)
			tabStates[state].visible = false;
		//figure out which state is active
		var activeState;
		if(!this._enabled)
			activeState = tabStates.disabled;
		else if(this._areaDown)
			activeState = tabStates.down;
		else if(this._areaOver)
			activeState = tabStates.over;
		if(!activeState)
			activeState = tabStates.up;
		//show active state
		activeState.visible = true;
	};
	
	p.onDragStart = function()
	{
		Application.instance.on("update", this.update);
	};
	
	p.update = function()
	{
		//update scrolling based on current tab position
		var scrollPercent;
		if(this._target.orientation == "vertical")
			scrollPercent = this.tab.y;
		else
			scrollPercent = this.tab.x;
		scrollPercent = (scrollPercent - this.minTabPos) / (this.maxTabPos - this.minTabPos);
		
		this._target.scrollPercent = scrollPercent;
	};
	
	p.onDragEnd = function()
	{
		Application.instance.off("update", this.update);
	};
	
	p.onListResize = function(listWidth, listHeight)
	{
		var target = this._target;
		this.enabled = target.maxScroll > 0;
		
		//TODO: calculate tab size and allowable scrollingness (of the tab)
	};
	
	p.onAreaDown = function()
	{
		this._areaDown = true;
		
		this._updateAreaState();
	};
	
	p.onAreaUp = function(event)
	{
		this._areaDown = false;
		
		//handle click on the scrolling area
		//future TODO: tween list and tab to new locations
		var local = event.data.getLocalPosition(this);
		var scrollPercent;
		if(this._target.orientation == "vertical")
		{
			this.tab.y = Math.clamp(local.y - this.tabSize / 2, this.minTabPos, this.maxTabPos);
			scrollPercent = (this.tab.y - this.minTabPos) / (this.maxTabPos - this.minTabPos);
		}
		else
		{
			this.tab.x = Math.clamp(local.x - this.tabSize / 2, this.minTabPos, this.maxTabPos);
			scrollPercent = (this.tab.x - this.minTabPos) / (this.maxTabPos - this.minTabPos);
		}
		
		this._target.scrollPercent = scrollPercent;
		
		this._updateAreaState();
	};
	
	p.onAreaUpOutside = function()
	{
		this._areaDown = false;
		
		this._updateAreaState();
	};
	
	p.onAreaOver = function()
	{
		this._areaOver = true;
		
		this._updateAreaState();
	};
	
	p.onAreaOut = function()
	{
		this._areaOver = false;
		
		this._updateAreaState();
	};
	
	p.onTabDown = function()
	{
		this._tabDown = true;
		
		this._updateTabState();
	};
	
	p.onTabUp = function()
	{
		this._tabDown = false;
		
		this._updateTabState();
	};
	
	p.onTabUpOutside = function()
	{
		this._tabDown = false;
		
		this._updateTabState();
	};
	
	p.onTabOver = function()
	{
		this._tabOver = true;
		
		this._updateTabState();
	};
	
	p.onTabOut = function()
	{
		this._tabOver = false;
		
		this._updateTabState();
	};
	
	p.destroy = function()
	{
		s.destroy.call(this);
		
		this.target = null;
		
		Application.instance.off("update", this.update);
		
		this.dragManager.destroy();
		
		this.area.destroy();
		this.tab.destroy();
		
		var state;
		for(state in this.tabStates)
		{
			this.tabStates[state].destroy();
			this.tabTextures[state].destroy();
		}
		for(state in this.areaStates)
		{
			this.areaStates[state].destroy();
			this.areaTextures[state].destroy();
		}
		
		this.dragManager = this.tab = this.area = this.tabStates = this.tabTextures =
			this.areaStates = this.areaTextures = this.onListResize = this.onAreaDown =
			this.onAreaUp = this.onAreaUpOutside = this.onAreaOver = this.onAreaOut =
			this.onTabDown = this.onTabUp = this.onTabUpOutside = this.onTabOver = this.onTabOut =
			this.onDragStart = this.onDragEnd = this.update = null;
	};
	
	namespace('springroll.pixi').Scroller = Scroller;
}());