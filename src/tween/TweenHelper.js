/**
*  @module Core
*  @namespace springroll
*/
(function() {
	
	var Tween = include("createjs.Tween"),
		Ease = include("createjs.Ease");
	
	/**
	 * TweenHelper is a static class for building more complex tweens. The primary function,
	 * TweenHelper.build(), takes an array of items like the following:
	
	[
		{
			//target is the object that should get passed to Tween.to() for the values to tween to.
			target:{x:35, y:50}
			//omitting time means a time of 0. If it is the first item in the list, properties
			//are set immediately instead of using Tween.to().
		},
		//numbers are Tween.wait() times in milliseconds.
		1000,
		{
			//string values in the target are considered relative to the original values
			//of the object before the tween
			target:{x:50, y:"35"},
			//time is in milliseconds for Tween.to().
			time:350,
			//if ease is used, it uses the easing function by that name from createjs.Ease.
			ease:"quadInOut"
		},
		{
			//Anything that isn't recognized, like this, is passed to the customHandler
			//parameter of TweenHelper.build() so that your code can do whatever it needs to in
			//that place in the list.
			audioToPlay:"MyAudioAlias"
		}
	]
	
	 * @class TweenHelper
	 */
	var TweenHelper = {};
	
	/**
	 * Builds a tween based on a list of actions.
	 * @method buildTween
	 * @static
	 * @param {Object} target The object to tween properties on.
	 * @param {Array} tweenList The list of tween actions.
	 * @param {Function} customHandler A function that handles custom actions. Takes the tween,
	 *                                 the list item, and the target, in that order. Returns the
	 *                                 (modified) tween object.
	 * @return {createjs.Tween} The created tween.
	 */
	TweenHelper.build = function(target, tweenList, customHandler)
	{
		var tween = Tween.get(target), item, ease, originalValues, madeClone, id;
		for(var i = 0, length = tweenList.length; i < length; ++i)
		{
			item = tweenList[i];
			//standard delay
			if(typeof item == "number")
			{
				tween = tween.wait(item);
			}
			else if(item.target)
			{
				var targetProps = item.target;
				//look for relative values
				madeClone = false;
				for(id in item.target)
				{
					if(typeof item.target[id] == "string")
					{
						if(!madeClone)
							targetProps = item.target.clone();
						if(!originalValues)
							originalValues = {};
						if(!originalValues.hasOwnProperty(id))
							originalValues[id] = target[id];
						targetProps[id] = originalValues[id] + parseFloat(item.target[id]);
					}
				}
				//tween the item
				if(item.time)
				{
					ease = item.ease ? Ease[item.ease] : null;
					tween = tween.to(targetProps, item.time, ease);
				}
				//set the item
				else
				{
					//if this is the first thing in the list, set values immediately
					//instead of waiting for the next frame
					if(i === 0)
					{
						for(id in targetProps)
						{
							target[id] = targetProps[id];
						}
					}
					else
						tween = tween.to(item.target, 0);
				}
			}
			//use callback to see how the dev wants to handle it
			else if(typeof customHandler == "function")
				tween = customHandler(tween, item, target);
		}
		return tween;
	};
	
	namespace('springroll').TweenHelper = TweenHelper;
}());