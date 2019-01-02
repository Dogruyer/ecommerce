(function () {
	/* jQuery Easing Plugin */
	jQuery.easing.jswing = jQuery.easing.swing;
	jQuery.extend(jQuery.easing, {
		def: "easeOutQuad",
		swing: function (e, f, a, h, g) {
			return jQuery.easing[jQuery.easing.def](e, f, a, h, g)
		},
		easeInQuad: function (e, f, a, h, g) {
			return h * (f /= g) * f + a
		},
		easeOutQuad: function (e, f, a, h, g) {
			return -h * (f /= g) * (f - 2) + a
		},
		easeInOutQuad: function (e, f, a, h, g) {
			if ((f /= g / 2) < 1) {
				return h / 2 * f * f + a
			}
			return -h / 2 * ((--f) * (f - 2) - 1) + a
		},
		easeInCubic: function (e, f, a, h, g) {
			return h * (f /= g) * f * f + a
		},
		easeOutCubic: function (e, f, a, h, g) {
			return h * ((f = f / g - 1) * f * f + 1) + a
		},
		easeInOutCubic: function (e, f, a, h, g) {
			if ((f /= g / 2) < 1) {
				return h / 2 * f * f * f + a
			}
			return h / 2 * ((f -= 2) * f * f + 2) + a
		},
		easeInQuart: function (e, f, a, h, g) {
			return h * (f /= g) * f * f * f + a
		},
		easeOutQuart: function (e, f, a, h, g) {
			return -h * ((f = f / g - 1) * f * f * f - 1) + a
		},
		easeInOutQuart: function (e, f, a, h, g) {
			if ((f /= g / 2) < 1) {
				return h / 2 * f * f * f * f + a
			}
			return -h / 2 * ((f -= 2) * f * f * f - 2) + a
		},
		easeInQuint: function (e, f, a, h, g) {
			return h * (f /= g) * f * f * f * f + a
		},
		easeOutQuint: function (e, f, a, h, g) {
			return h * ((f = f / g - 1) * f * f * f * f + 1) + a
		},
		easeInOutQuint: function (e, f, a, h, g) {
			if ((f /= g / 2) < 1) {
				return h / 2 * f * f * f * f * f + a
			}
			return h / 2 * ((f -= 2) * f * f * f * f + 2) + a
		},
		easeInSine: function (e, f, a, h, g) {
			return -h * Math.cos(f / g * (Math.PI / 2)) + h + a
		},
		easeOutSine: function (e, f, a, h, g) {
			return h * Math.sin(f / g * (Math.PI / 2)) + a
		},
		easeInOutSine: function (e, f, a, h, g) {
			return -h / 2 * (Math.cos(Math.PI * f / g) - 1) + a
		},
		easeInExpo: function (e, f, a, h, g) {
			return (f == 0) ? a : h * Math.pow(2, 10 * (f / g - 1)) + a
		},
		easeOutExpo: function (e, f, a, h, g) {
			return (f == g) ? a + h : h * (-Math.pow(2, -10 * f / g) + 1) + a
		},
		easeInOutExpo: function (e, f, a, h, g) {
			if (f == 0) {
				return a
			}
			if (f == g) {
				return a + h
			}
			if ((f /= g / 2) < 1) {
				return h / 2 * Math.pow(2, 10 * (f - 1)) + a
			}
			return h / 2 * (-Math.pow(2, -10 * --f) + 2) + a
		},
		easeInCirc: function (e, f, a, h, g) {
			return -h * (Math.sqrt(1 - (f /= g) * f) - 1) + a
		},
		easeOutCirc: function (e, f, a, h, g) {
			return h * Math.sqrt(1 - (f = f / g - 1) * f) + a
		},
		easeInOutCirc: function (e, f, a, h, g) {
			if ((f /= g / 2) < 1) {
				return -h / 2 * (Math.sqrt(1 - f * f) - 1) + a
			}
			return h / 2 * (Math.sqrt(1 - (f -= 2) * f) + 1) + a
		},
		easeInElastic: function (f, h, e, l, k) {
			var i = 1.70158;
			var j = 0;
			var g = l;
			if (h == 0) {
				return e
			}
			if ((h /= k) == 1) {
				return e + l
			}
			if (!j) {
				j = k * 0.3
			}
			if (g < Math.abs(l)) {
				g = l;
				var i = j / 4
			} else {
				var i = j / (2 * Math.PI) * Math.asin(l / g)
			}
			return -(g * Math.pow(2, 10 * (h -= 1)) * Math.sin((h * k - i) * (2 * Math.PI) / j)) + e
		},
		easeOutElastic: function (f, h, e, l, k) {
			var i = 1.70158;
			var j = 0;
			var g = l;
			if (h == 0) {
				return e
			}
			if ((h /= k) == 1) {
				return e + l
			}
			if (!j) {
				j = k * 0.3
			}
			if (g < Math.abs(l)) {
				g = l;
				var i = j / 4
			} else {
				var i = j / (2 * Math.PI) * Math.asin(l / g)
			}
			return g * Math.pow(2, -10 * h) * Math.sin((h * k - i) * (2 * Math.PI) / j) + l + e
		},
		easeInOutElastic: function (f, h, e, l, k) {
			var i = 1.70158;
			var j = 0;
			var g = l;
			if (h == 0) {
				return e
			}
			if ((h /= k / 2) == 2) {
				return e + l
			}
			if (!j) {
				j = k * (0.3 * 1.5)
			}
			if (g < Math.abs(l)) {
				g = l;
				var i = j / 4
			} else {
				var i = j / (2 * Math.PI) * Math.asin(l / g)
			}
			if (h < 1) {
				return -0.5 * (g * Math.pow(2, 10 * (h -= 1)) * Math.sin((h * k - i) * (2 * Math.PI) / j)) + e
			}
			return g * Math.pow(2, -10 * (h -= 1)) * Math.sin((h * k - i) * (2 * Math.PI) / j) * 0.5 + l + e
		},
		easeInBack: function (e, f, a, i, h, g) {
			if (g == undefined) {
				g = 1.70158
			}
			return i * (f /= h) * f * ((g + 1) * f - g) + a
		},
		easeOutBack: function (e, f, a, i, h, g) {
			if (g == undefined) {
				g = 1.70158
			}
			return i * ((f = f / h - 1) * f * ((g + 1) * f + g) + 1) + a
		},
		easeInOutBack: function (e, f, a, i, h, g) {
			if (g == undefined) {
				g = 1.70158
			}
			if ((f /= h / 2) < 1) {
				return i / 2 * (f * f * (((g *= (1.525)) + 1) * f - g)) + a
			}
			return i / 2 * ((f -= 2) * f * (((g *= (1.525)) + 1) * f + g) + 2) + a
		},
		easeInBounce: function (e, f, a, h, g) {
			return h - jQuery.easing.easeOutBounce(e, g - f, 0, h, g) + a
		},
		easeOutBounce: function (e, f, a, h, g) {
			if ((f /= g) < (1 / 2.75)) {
				return h * (7.5625 * f * f) + a
			} else {
				if (f < (2 / 2.75)) {
					return h * (7.5625 * (f -= (1.5 / 2.75)) * f + 0.75) + a
				} else {
					if (f < (2.5 / 2.75)) {
						return h * (7.5625 * (f -= (2.25 / 2.75)) * f + 0.9375) + a
					} else {
						return h * (7.5625 * (f -= (2.625 / 2.75)) * f + 0.984375) + a
					}
				}
			}
		},
		easeInOutBounce: function (e, f, a, h, g) {
			if (f < g / 2) {
				return jQuery.easing.easeInBounce(e, f * 2, 0, h, g) * 0.5 + a
			}
			return jQuery.easing.easeOutBounce(e, f * 2 - g, 0, h, g) * 0.5 + h * 0.5 + a
		}
	});

	/* jQuery Easing Effects List
		--------------------------
		def, jswing, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic, easeInQuart, easeOutQuart, easeInOutQuart, easeInSine, easeOutSine
		easeInOutSine, easeInExpo, easeOutExpo, easeInOutExpo, easeInQuint, easeOutQuint, easeInOutQuint, easeInCirc, easeOutCirc, easeInOutCirc, easeInElastic, easeOutElastic
		easeInOutElastic, easeInBack, easeOutBack, easeInOutBack, easeInBounce, easeOutBounce, easeInOutBounce,	
	*/

	/* jQuery Smarty Drop Menu Plugin */
	jQuery.fn.SmartyDropMenu = function (opt) {
		var opt = jQuery.extend({
			dropMenuSubCategoryWidth: 180,
			/*  320[2], 480[3], 640[4], 800[5] px vs vs.. */
			numberOfColumns: 1,
			extraLeftSpace: 0,
			/* Ana Link 'de border varsa sub category 'de bulunan boslugu duzenltebiliriz. */
			dropMenuEffect: 'show',
			InEffect: 'easeInSine',
			OutEffect: 'easeOutSine',
			speedIn: 500,
			speedOut: 200,
			/* Html Selectors */
			dropMenuSubCategorySelector: '.dropMenuSubCategory',
			thirdLevelCategoriesSelector: '.thirdLevelCategories',
			thirdLevelCategoriesSelectorActive: 'thirdLevelCategoriesActive',
			dropMenuColumnsSelector: '.dropMenuColumns',
			dropMenuActiveLinkSelector: 'downMenuActiveLink',
			dropMenuSubLinkSelector: 'dropMenuSubArrow',
			byPassLineSelector: 'byPassLine',
			/* Category Settings */
			showOrHideThirdLevelCategory: false,
			countThirdLevelCategories: 3,
			removeThirdLevelCategories: false
		}, opt);

		var el = jQuery(this);
		jQuery(el).find(opt.dropMenuSubCategorySelector).css({
			'width': opt.dropMenuSubCategoryWidth + 'px'
		});

		jQuery(el).find(opt.dropMenuSubCategorySelector).each(function () { /* Alt Kategorisi Olan Linklere Asagi Ok Ekler. */
			if (jQuery(this).find('.dropMenuColumns').length > 0) {
				jQuery(this).parent().find('> a').addClass(opt.dropMenuSubLinkSelector);
			}
		});
		dropMenuSubCategoryPosition = function (event) { /* Alt Kategorileri, Ana Basliklarin Bulundugu Yere Gore Konumlandir */
			var browserWidth = jQuery(window).width();
			var dropMenuSubCategoryLeftPosition = jQuery(event).offset().left;
			var dropMenuSubCategoryOuterWidth = jQuery(opt.dropMenuSubCategorySelector).outerWidth();
			if ((browserWidth - dropMenuSubCategoryLeftPosition) < dropMenuSubCategoryOuterWidth) {
				jQuery(event).find(opt.dropMenuSubCategorySelector).css({
					'right': '-' + opt.extraLeftSpace + 'px',
					'left': 'auto'
				});
			} else {
				jQuery(event).find(opt.dropMenuSubCategorySelector).css({
					'left': '-' + opt.extraLeftSpace + 'px',
					'right': 'auto'
				});
			}
		}
		CategoriesTripping = function (event) {
			switch (event) {
				case "fade":
					jQuery(el).find(' > ul > li').hover(function () {
						dropMenuSubCategoryPosition(this);
						if (jQuery(this).find(opt.dropMenuSubCategorySelector + ' ' + opt.dropMenuColumnsSelector).length > 0) {
							jQuery(this).find(opt.dropMenuSubCategorySelector).stop(true, true).delay(800).fadeIn(opt.speedIn);
							jQuery('.dropMenuOverlay').show();
						}
						jQuery(this).find(' > a').addClass(opt.dropMenuActiveLinkSelector);

						jQuery(this).find(opt.dropMenuColumnsSelector).each(function () {
							var thirdLevelCategoryLength = jQuery(this).find('.thirdLevelCategories li').length;
							if (thirdLevelCategoryLength > 0) {
								jQuery(this).find('> a').addClass('dropMenuColumnsTitleActive');
								jQuery(this).hover(function () {
									jQuery(this).find(opt.thirdLevelCategoriesSelector).addClass(opt.thirdLevelCategoriesSelectorActive);
								}, function () {
									jQuery(this).find(opt.thirdLevelCategoriesSelector).removeClass(opt.thirdLevelCategoriesSelectorActive);
								});
							} else {
								jQuery(this).find('.thirdLevelCategories').remove();
								jQuery(this).find('> a').removeClass('dropMenuColumnsTitleActive');
							}
						});
					}, function () {
						if (jQuery(this).find(opt.dropMenuSubCategorySelector + ' ' + opt.dropMenuColumnsSelector).length > 0) {
							jQuery(this).find(opt.dropMenuSubCategorySelector).stop(true, true).fadeOut(opt.speedOut);
						}
						jQuery(this).find(' > a').removeClass(opt.dropMenuActiveLinkSelector);
						jQuery('.dropMenuOverlay').hide();
					});
					break

				case "show":
					jQuery(el).find(' > ul > li').hover(function () {
						dropMenuSubCategoryPosition(this);
						if (jQuery(this).find(opt.dropMenuSubCategorySelector + ' ' + opt.dropMenuColumnsSelector).length > 0) {
							setTimeout((function () {
								jQuery(this).find(opt.dropMenuSubCategorySelector).stop(true, true).animate({
									height: "toggle"
								}, opt.speedIn, opt.OutEffect);
							}), 1000);
						}
						jQuery(this).find(' > a').addClass(opt.dropMenuActiveLinkSelector);

						jQuery(this).find(opt.dropMenuColumnsSelector).each(function () {
							var thirdLevelCategoryLength = jQuery(this).find('.thirdLevelCategories li').length;
							if (thirdLevelCategoryLength > 0) {
								jQuery(this).find('> a').addClass('dropMenuColumnsTitleActive');
								jQuery(this).hover(function () {

									jQuery(this).find(opt.thirdLevelCategoriesSelector).addClass(opt.thirdLevelCategoriesSelectorActive);
								}, function () {
									jQuery(this).find(opt.thirdLevelCategoriesSelector).removeClass(opt.thirdLevelCategoriesSelectorActive);
								});
							} else {
								jQuery(this).find('.thirdLevelCategories').remove();
								jQuery(this).find('> a').removeClass('dropMenuColumnsTitleActive');
							}
						});
						jQuery('.dropMenuOverlay').show();
					}, function () {
						if (jQuery(this).find(opt.dropMenuSubCategorySelector + ' ' + opt.dropMenuColumnsSelector).length > 0) {
							setTimeout((function () {
								jQuery(this).find(opt.dropMenuSubCategorySelector).stop(true, true).animate({
									height: "toggle"
								}, opt.speedOut, opt.InEffect);
							}), 1000);

						}
						jQuery(this).find(' > a').removeClass(opt.dropMenuActiveLinkSelector);
						jQuery('.dropMenuOverlay').hide();
					});
					break

					/*Default Effect*/
				default:
					jQuery(el).find(' > ul > li').hover(function () {
						dropMenuSubCategoryPosition(this);
						if (jQuery(this).find(opt.dropMenuSubCategorySelector + ' ' + opt.dropMenuColumnsSelector).length > 0) {
							setTimeout((function () {
								jQuery(this).find(opt.dropMenuSubCategorySelector).stop(true, true).fadeIn(opt.speedIn);
							}), 1000);
						}
						jQuery(this).find(' > a').addClass(opt.dropMenuActiveLinkSelector);
					}, function () {
						if (jQuery(this).find(opt.dropMenuSubCategorySelector + ' ' + opt.dropMenuColumnsSelector).length > 0) {
							jQuery(this).find(opt.dropMenuSubCategorySelector).stop(true, true).fadeOut(opt.speedOut);
						}
						jQuery(this).find(' > a').removeClass(opt.dropMenuActiveLinkSelector);
					});
			}
		};
		CategoriesTripping(opt.dropMenuEffect);

		showOrHideThirdLevelCategory = function (event) {
			if (event == true) {
				jQuery(el).find(opt.thirdLevelCategoriesSelector).each(function () {
					var thirdLevelCategoriesLi = jQuery(this).find('li').length;
					if (thirdLevelCategoriesLi > opt.countThirdLevelCategories) {
						jQuery(this).find('li::gt(' + (opt.countThirdLevelCategories - 1) + ')').remove();
						thirdLevelCategoriesLi = jQuery(this).find('li').length
						jQuery(this).find('li:last-child').after('<li><a class="viewAll" href="' + jQuery(this).parent().find(' > a').attr('href') + '">TÃ¼mÃ¼nÃ¼ GÃ¶rÃ¼ntÃ¼le</a></li>');
					}
				});
			}
		};
		showOrHideThirdLevelCategory(opt.showOrHideThirdLevelCategory);

		byPassControl = function (columns) {
			jQuery('.dropMenuSubCategory').find('.dropMenuColumns:nth-child(' + columns + 'n)').after('<div class="_clear"></div>');
		}
		byPassControl(opt.numberOfColumns);

		removeThirdLevelCategories = function (event) {
			if (event == true) {
				jQuery(opt.thirdLevelCategoriesSelector).remove();
			}
		};
		removeThirdLevelCategories(opt.removeThirdLevelCategories);
	};
})();