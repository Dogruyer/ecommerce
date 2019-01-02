var HorizontalFilterMenu = {
	isFirstInitialize: true,
	initialize: function(){
		if(this.isCategory()){
			this.setCurrentId();
			if(this.isFirstInitialize){
				var labels;
				if(typeof HorizontalFilterMenu.getUrlParams()['labels'] != 'undefined'){
					labels = HorizontalFilterMenu.getUrlParams()['labels'];
				}else{
					labels = '';
				}
				var labelLength = labels.split(',').length;
				if(labelLength > 1){
					this.selectIds = labels.split(',');
					this.isFirstInitialize = false;
				}
			}
			this.selectRemoveId(this.selectIds, this.currentId + '-2');
			this.getCategoryContent();
			this.events();
		}
	},
	selectIds: [],
	selectRemoveId: function(arr) {
		var what,
			a = arguments,
			ax;
		while (a.length > 1 && arr.length) {
			what = a[--a.length];
			while ((ax= arr.indexOf(what)) !== -1) {
				arr.splice(ax, 1);
			}
		}
		return arr;
	},
	isCategory: function(){
		if(window.location.pathname.indexOf('LA_') > -1 || window.location.pathname.indexOf('/kategori/') > -1){
			return true
		}else{
			return false
		}
	},
	currentId: '',
	setCurrentId: function(){
		this.currentId = window.location.pathname.split('LA_')[1].replace('-2.html', '');
	},
	objectLength: function(value) {
		var i = 0;
		for(var j in value) {
			if(Object.prototype.hasOwnProperty.call(value, j)){
				i++
			}
		}
		return i;
	},
	getUrlParams: function(){
		var vars = {};
		var hashes = window.location.href.slice(window.location.href.indexOf('#') + 1).split('?');
		if(hashes.length > 1) {
			vars['state'] = hashes[0];
			hashes = hashes[1].split('&');
		} else {
			hashes = hashes[0].split('&');
		}
		for(var i = 0; i < hashes.length; i++) {
			var hash = hashes[i].split('=');
			if(hash.length > 1) {
				vars[hash[0]] = hash[1];
			} else {
				vars[hash[0]] = null;
			}
		}
		return vars;
	},
	getCurrentHash: function(ids){
		var currentHash = '',
			total = this.objectLength(this.getUrlParams());
			params = this.getUrlParams(),
			eachIndex = 0;
		jQuery.each(params, function(key, value){
			var lastString;
			if (eachIndex === total - 1) {
				lastString = '';
			}else{
				lastString = '&';
			}
			if(key == 'labels'){
				currentHash += (key + '=' + ids) + lastString;
			}else{
				currentHash += (key + '=' + value) + lastString;
			}
			eachIndex++;
		});
		return currentHash;
	},
	events: function(){
		var that = this;
		jQuery(document).on('change', '[data-action=filterChange]', function(event){
			event.preventDefault();
			event.stopImmediatePropagation();
			var groupId = jQuery(this).parents('[data-id]').attr('data-id'),
				selectedId = jQuery(this).find(' > option:selected').val(),
				selectedLabel = jQuery(this).find(' > option:selected').html(),
				filterMenu = jQuery('#horizontalFilterMenu'),
				selectedFilters = jQuery('#horizontalFilterMenuSelectedFilters');
			if(selectedId == '0'){
				return
			}
			if(that.selectIds.indexOf(selectedId + '-' + groupId) != -1){
				return
			}
			that.selectIds.push(selectedId + '-' + groupId);
			if(selectedFilters.length == 0){
				filterMenu.after('<div id="horizontalFilterMenuSelectedFilters" class="_clearfix"> \
					<div class="allClear"> \
						<a href="javascript:void(0)" data-action="filterClearAll">TÃ¼mÃ¼nÃ¼ Temizle</a>  \
					</div> \
				</div>');
				selectedFilters = jQuery('#horizontalFilterMenuSelectedFilters');
			}
			if(selectedFilters.length > 0){
				var variantId,
					variantSelectId,
					isGroupVariant = (typeof jQuery(this).parent().attr('data-variant-id') != 'undefined');
				if(isGroupVariant){
					variantId = jQuery(this).parent().attr('data-variant-id');
					variantSelectId = jQuery(this).find('option:selected').val();
				}
				if(selectedFilters.find('[data-group-id=' + (isGroupVariant ? (variantId + '-' + groupId) : groupId) + ']').length > 0){
					selectedFilters.find('[data-group-id=' + (isGroupVariant ? (variantId + '-' + groupId) : groupId) + ']').append('<a href="javascript:void(0)" data-action="remove-filter" data-id="' + (isGroupVariant ? (variantSelectId + '-' + groupId) : selectedId + '-' + groupId) + '">' + selectedLabel + '</a>');
				}else{
					selectedFilters.append('<div class="selectedFilterList _clearfix" data-group-id="' + (isGroupVariant ? (variantId + '-' + groupId) : groupId) + '"> \
						<span>' + jQuery(this).parent().find('.filterLabel').text() + ': </span> <a href="javascript:void(0)" data-action="remove-filter" data-id="' + (isGroupVariant ? (variantSelectId + '-' + groupId) : selectedId + '-' + groupId) + '">' + selectedLabel + '</a> \
					</div>');
				}
			}
			jQuery(this).find('option').prop('selected', false);
			window.location.hash = that.getCurrentHash(that.currentId + '-2,' + that.selectIds.join(','));
		});
		jQuery(document).on('click', '[data-action=filterClearAll]', function(event){
			
			that.allClearSelected();
			window.location.hash = that.getCurrentHash(that.currentId + '-2');
			
		});
		jQuery(document).on('click', '[data-action=remove-filter]', function(event){
			event.preventDefault();
			event.stopImmediatePropagation();
			that.selectRemoveId(that.selectIds, jQuery(this).attr('data-id'));
			var params,
				selectedFilters = jQuery('#horizontalFilterMenuSelectedFilters');
				totalFilterLength = selectedFilters.find('.selectedFilterList > a').length - 1,
				currentFilterLength = jQuery(this).parent().find(' > a').length - 1;
			if(that.selectIds.length > 0){
				params = that.currentId + '-2,' + that.selectIds.join(',');
			}else{
				params = that.currentId + '-2';
			}
			if(totalFilterLength == 0){
				selectedFilters.remove();
			}
			if(currentFilterLength == 0){
				jQuery(this).parent().remove();
			}
			jQuery(this).remove();
			window.location.hash = that.getCurrentHash(params);
		});
	},
	allClearSelected: function(){
		var filterMenu = jQuery('#horizontalFilterMenu'),
			selectedFilters = jQuery('#horizontalFilterMenuSelectedFilters');
		this.selectIds = [this.currentId + '-2'];
		filterMenu.find('option').prop('selected', false);
		selectedFilters.remove();
	},
	onDOMLoaded: function(callback){
		var DOMLoadTimer = setInterval(function () {
			if (document.readyState == 'complete') {
				clearInterval(DOMLoadTimer);
				if (callback) {
					callback();
				}
			}
		}, 10);
	},
	getCategoryContent: function(){
		this.onDOMLoaded(function(){
			jQuery.get('/index.php?do=catalog/labelFilterBlock.ajax&labels=' + this.currentId + '-2').done(function(response){
				var data = jQuery.parseJSON(response)['results'];
				if(data == ''){
					return
				}
				var filters = {};
				filters['brands'] = data['brands'];
				filters['variants'] = data['variants'];
				filters['prices'] = data['price_gaps'];
				filters['features'] = data['feature_options'];
				
				var getType = function(key){
					var id,
						labels;
					if(key == 'brands') {
						id = '3';
						labels = 'Marka';
					} else if(key == 'prices') {
						id = '7';
						labels = 'Fiyat AralÄ±ÄŸÄ±';
					} else if(key == 'features') {
						id = '5';
						labels = 'Filtre SeÃ§enekleri';
					} else if(key == 'variants') {
						id = '11';
						labels = '';
					}
					return [id, labels];
				};
				if(jQuery('#horizontalFilterMenu').length == 0){
					jQuery('.contentSection').prepend('<div id="horizontalFilterMenu" class="_clearfix"></div>');
					jQuery.each(filters, function(key, value){
						var id = getType(key)[0],
							labels = getType(key)[1];
						if(typeof value != 'undefined'){
							jQuery('#horizontalFilterMenu').append('<div class="filter-' + key + ' _clearfix" data-id="' + id + '"> \
								<div class="filterLabel">' + labels + '</div> \
								<select class="_selectBox" data-action="filterChange"> \
									<option value="0">SeÃ§iniz</option> \
								</select> \
							</div>');
						}
						var columns = jQuery('#horizontalFilterMenu').find('.filter-' + key);
						for(var i in value){
							if(value[i].hasOwnProperty('childs')){
								if(columns.find(' > select').length > -1){
									columns.find(' > select').remove();
									columns.find(' > .filterLabel').remove();
								}
								columns.append('<div class="filterVariant-' + value[i]['id'] + '" data-variant-id="' + value[i]['id'] + '"> \
									<div class="filterLabel">' + value[i]['title'] + '</div> \
									<select class="_selectBox" data-action="filterChange"> \
										<option value="0">SeÃ§iniz</option> \
									</select> \
								</div>');
								var variantColumns = jQuery('.filterVariant-' + value[i]['id']);
								for(var j in value[i]['childs']){
									variantColumns.find(' > select').append('<option value="' + value[i]['childs'][j]['id'] + '">' + value[i]['childs'][j]['title'] + '</option>');
								}
							}else{
								columns.find(' > select').append('<option value="' + value[i]['id'] + '">' + value[i]['title'] + '</option>');
							}
						}
					});
					var labelIds = HorizontalFilterMenu.getUrlParams()['labels'].split(','),
						filterMenu = jQuery('#horizontalFilterMenu'),
						selectedFilters = jQuery('#horizontalFilterMenuSelectedFilters');
					for (i = 0; i < labelIds.length; i++) {
						var fId = labelIds[i].split('-')[0],
							gId = labelIds[i].split('-')[1];
						var variantId,
							variantSelectId = fId,
							isGroupVariant = (gId == '11'),
							filterLabel = filterMenu.find('[data-id=' + gId + ']').find('option[value=' + fId + ']').text();
							groupLabel = '';
							/* Gostermek (*istemediginiz) filtrelerin id'lerini buraya tanimlamaliyiz.
								if(gId != '2' && gId != '11' && gId != '11'){
									...
								}
							*/
						if(gId != '2'){
							if(selectedFilters.length == 0){
								filterMenu.after('<div id="horizontalFilterMenuSelectedFilters" class="_clearfix"> \
									<div class="allClear"> \
										<a href="javascript:void(0)" data-action="filterClearAll">TÃ¼mÃ¼nÃ¼ Temizle</a>  \
									</div> \
								</div>');
								selectedFilters = jQuery('#horizontalFilterMenuSelectedFilters');
							}
							var selectedVariantOption;
							if(isGroupVariant){
								selectedVariantOption = filterMenu.find('[data-id=' + gId + ']').find('select > option[value=' + fId + ']');
								variantId = selectedVariantOption.parent().parent().attr('data-variant-id');
							}
							if(filterMenu.find('[data-id=' + gId + ']').find(' > .filterLabel').length > 0){
								groupLabel = filterMenu.find('[data-id=' + gId + ']').find(' > .filterLabel').text();
							}
							if(filterMenu.find('[data-id=' + gId + ']').find(' > div > .filterLabel').length > 0){
								groupLabel = selectedVariantOption.parent().parent().find(' > .filterLabel').text();
							}
							if(selectedFilters.find('[data-group-id=' + (isGroupVariant ? (variantId + '-' + gId) : gId) + ']').length == 0){
								selectedFilters.append('<div class="selectedFilterList _clearfix" data-group-id="' + (isGroupVariant ? (variantId + '-' + gId) : gId) + '"><span>' + groupLabel + ': </span></div>');
							}
							selectedFilters.find('[data-group-id=' + (isGroupVariant ? (variantId + '-' + gId) : gId) + ']').append('<a href="javascript:void(0)" data-action="remove-filter" data-id="' + (fId + '-' + gId) + '">' + filterLabel + '</a>');
						}
					}
				}
			});
		}.bind(this));
	}
}
 