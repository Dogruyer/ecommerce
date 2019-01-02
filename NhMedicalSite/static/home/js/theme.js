function ajaxCategoryScriptFunc() {
	/* if(window.HorizontalFilterMenu){
		HorizontalFilterMenu.initialize();
	} */
	if (typeof ajaxCategoryProcess == 'function') {
		ajaxCategoryProcess();
	}
}

jQuery(document).ready(function () {
	if (navigator.appName == "Microsoft Internet Explorer") {
		jQuery('[placeholder]').focus(function () {
			var input = jQuery(this);
			if (input.val() == input.attr('placeholder')) {
				input.val('');
				input.removeClass('placeholder');
			}
		}).blur(function () {
			var input = jQuery(this);
			if (input.val() == '' || input.val() == input.attr('placeholder')) {
				input.addClass('placeholder');
				input.val(input.attr('placeholder'));
			}
		}).blur().parents('form').submit(function () {
			jQuery(this).find('[placeholder]').each(function () {
				var input = jQuery(this);
				if (input.val() == input.attr('placeholder')) {
					input.val('');
				}
			})
		});
	}
	jQuery('.dropBox').click(function () {
		if (jQuery(this).parent().find('.dropBoxContent').css('display') == 'none') {
			jQuery(this).parent().find('.dropBoxContent').stop(true, true).fadeIn(200);
			jQuery(this).addClass('dropBoxActive');
		} else {
			jQuery(this).parent().find('.dropBoxContent').fadeOut(200);
			jQuery(this).removeClass('dropBoxActive');
		}
	});
	jQuery(document).mouseup(function (e) {
		if (!jQuery('.dropBoxContent').is(e.target) && jQuery('.dropBoxContent').has(e.target).length === 0) {
			jQuery('.dropBoxContent').fadeOut(200);
			jQuery('.dropBox').removeClass('dropBoxActive');
		}
	});

	jQuery(window).scroll(function () {
		if (jQuery(this).scrollTop() > 100) {
			jQuery("#scrollTop").fadeIn();
			jQuery(".headerBottomRow:nth-child(2)").addClass("fixed");
		} else {
			jQuery("#scrollTop").fadeOut();
			jQuery(".headerBottomRow:nth-child(2)").removeClass("fixed");
		}
	});
	jQuery("#scrollTop").click(function () {
		jQuery("html, body").animate({
			scrollTop: 0
		}, 600);
		return false
	});

	var uriList = [
		'?do=members/login',
		'?do=static/contactus',
		'?do=member/signup',
		'?do=members/signup',
		'?do=catalog/order',
		'?do=catalog/order2',
		'?do=catalog/order3',
		'?do=catalog/orderFinished',
		'?do=members/login2',
		'?do=static/contactForm',
		'?do=default/contactForm',
		'?do=static/btForm',
		'?do=member/btForm',
		'?do=members/forgotpass',
		'?do=member/forgotpass',
		'?do=static/supportForm',
		'?do=member/supportForm',
		'?do=dynamic/start',
		'?do=members/funcsuccess',
		'?do=members/shippinginQuiry',
		'?do=members/payments',
		'?do=members/payment',
		'?do=members/paymentDirectionForm'
	];
	var urlLocation = window.location.search;
	if (jQuery.inArray(urlLocation, uriList) > -1) {
		jQuery('.leftBlocks').parent().remove();
		jQuery('.contentSection').removeClass().addClass('contentSection-Page');
	}

	var news = window.location.pathname;
	if (news == "/haberler.html") {
		jQuery('.leftBlocks').parent().remove();
		jQuery('.contentSection').removeClass().addClass('contentSection-Page');
	}

	var locationSearch = (window.location.search).split('&');
	if (locationSearch[0] == "?do=catalog/order") {
		jQuery('.leftBlocks').parent().remove();
		jQuery('.contentSection').removeClass().addClass('contentSection-Page');
	}
});