(function ($) {
    "use strict";
    $(function () {

        if($('#book-a-place-scheme').length == 0) return;

        $.blockUI.defaults.message = '<p style="margin: 0;">' + bap_object.loc_strings.please_wait + '</p>';

        var scheme_id = $('#scheme').data('scheme-id'),
            event_id = $('#scheme').data('event-id'),
            checkoutSubmitHandler = function () {

                var checkoutFirstName = $('#checkout-first-name'),
                    checkoutLastName = $('#checkout-last-name'),
                    checkoutEmail = $('#checkout-email'),
                    checkoutPhone = $('#checkout-phone'),
                    checkoutSelfDelivery = $('#checkout-delivery-self'),
                    checkoutDelivery = $('#checkout-delivery-help');

                if (checkoutFirstName.val().length == 0) {
                    checkoutFirstName.parents(".field").addClass('error')
                } else {
                    checkoutFirstName.parents(".field").removeClass('error')
                }

                /*if (checkoutLastName.val().length == 0) {
                    checkoutLastName.parents(".field").addClass('error')
                } else {
                    checkoutLastName.parents(".field").removeClass('error')
                }*/

                if (checkoutEmail.val().length == 0 || !validateEmail(checkoutEmail.val())) {
                    checkoutEmail.parents(".field").addClass('error')
                } else {
                    checkoutEmail.parents(".field").removeClass('error')
                }

                if (checkoutPhone.val().length == 0 || !validatePhone(checkoutPhone.val())) {
                    checkoutPhone.parents(".field").addClass('error')
                } else {
                    checkoutPhone.parents(".field").removeClass('error')
                }

                if (checkoutFirstName.val().length == 0 ||
                    /*checkoutLastName.val().length == 0 ||*/
                    checkoutEmail.val().length == 0 || !validateEmail(checkoutEmail.val()) ||
                    checkoutPhone.val().length == 0 || !validatePhone(checkoutPhone.val())) {

                    return false;
                }

                var dialog = this,
                    data = {
                        action: 'checkout',
                        first_name: checkoutFirstName.val(),
                        last_name: checkoutLastName.val(),
                        email: checkoutEmail.val(),
                        phone: checkoutPhone.val(),
                        self_delivery: checkoutSelfDelivery.val(),
                        delivery: checkoutDelivery.val(),
                        scheme_id: scheme_id,
                        event_id: event_id
                    };

                $(dialog).dialog("close");
                $.blockUI();

                $.post(bap_object.ajaxurl, data, function (response) {

                    var currLocation = window.location.href;
                    if (currLocation.indexOf('?') != -1) {
                        window.location = currLocation + '&s_msg=1';
                    } else {
                        window.location = currLocation + '?s_msg=1';
                    }

                    refreshSchemeAndCartCallback(response.content);

                    $.unblockUI();
                });
            },
            addCountdown = function() {
                var cartExpirationTime = $('#cart-expiration-time'),
                    time = new Date().getTime(),
                    ts = Math.floor(time / 1000);

                cartExpirationTime.attr('data-time', ts + cartExpirationTime.data("time-left") );

                $('#bap-countdown-container').show();

                $(".kkcount-down").kkcountdown({
                    dayText : 'day ',
                    daysText : 'days ',
                    hoursText : ':',
                    minutesText : ':',
                    secondsText : false,
                    displayZeroDays : false,
                    oneDayClass : 'one-day',
                    callback : function () {
                        $('#bap-countdown-container').hide();
                        refreshScheme();
                        refreshCart();
                    }
                });
            };

        setInterval(refreshScheme, 5000)
        //setInterval(refreshCart, 5000)

        addCellEventHandlers();

        addCountdown();

        $(document).tooltip({
            tooltipClass : 'bap-tooltip',
            items: '.scheme-cell',
            position: {
                my: "left top+5"
            },
            content: function () {
                return $('#tooltip-scheme-place-' + $(this).data('place-id')).html();
            }
        });


        //$("#cart-checkout").button();


        var bapCartFormDialogButtonsObj = {};
        bapCartFormDialogButtonsObj[bap_object.loc_strings.checkout] = checkoutSubmitHandler;
        bapCartFormDialogButtonsObj[bap_object.loc_strings.cancel] = function () {
            $(this).dialog("close");
        };
        $("#bap-cart-form-dialog").dialog({
            dialogClass: "bap-dialog",
            autoOpen: false,
            height: 600,
            width: 600,
            modal: true,
            buttons: bapCartFormDialogButtonsObj,
            draggable: false
        });


        var schemeWarningMessageButtonsObj = {};
        schemeWarningMessageButtonsObj[bap_object.loc_strings.ok] = function () {
            $(this).dialog("close");
        };
        $("#scheme-warning-message").dialog({
            dialogClass: "bap-dialog",
            autoOpen: false,
            modal: true,
            buttons: schemeWarningMessageButtonsObj,
            draggable: false
        });


        var schemeEmptyCartDialogButtonsObj = {};
        schemeEmptyCartDialogButtonsObj[bap_object.loc_strings.ok] = function () {
            $(this).dialog("close");
        };
        $("#bap-empty-cart-dialog").dialog({
            dialogClass: "bap-dialog",
            autoOpen: false,
            modal: true,
            buttons: schemeEmptyCartDialogButtonsObj,
            draggable: false
        });


        $("#cart-checkout").unbind('click').click(function (e) {
            e.preventDefault();

            if ($('.bap-place-in-cart').length) {
                $("#bap-cart-form-dialog").dialog("open");
            } else {
                $("#bap-empty-cart-dialog").dialog("open");
            }

            return false;
        });


        function refreshScheme() {

            if (!bookAPLaceEventBookingOpen) {
                return;
            }

            var data = {
                action: 'refresh_scheme',
                scheme_id: scheme_id,
                event_id: event_id
            };

            $.post(bap_object.ajaxurl, data, function (response) {
                $('#scheme-container').empty().append(response);
                if (!bookAPLaceEventBookingOpen) {
                    $('#shopping-cart-container').empty();
                    $('#shopping-cart-controls-container').empty();
                }
            });

        }

        function refreshCart() {

            var data = {
                action: 'refresh_cart'
            };

            $.post(bap_object.ajaxurl, data, function (response) {
                $('#shopping-cart-container').empty().append(response);
            });

        }

        function refreshSchemeAndCartCallback(response) {
            $('#scheme-container').replaceWith($(response).find('#scheme-container'));
            $('#shopping-cart-container').replaceWith($(response).find('#shopping-cart-container'));
            addCountdown();
        }

        function addCellEventHandlers() {
            $(document).on('mouseenter', '.scheme-place-available', function () {

                var self = $(this),
                    placeId = self.data('place-id'),
                    isCellSelected = self.toggleClass('scheme-cell-selected').hasClass('scheme-cell-selected');

                toggleAllCellsOfPlace(placeId, isCellSelected);

            });

            $(document).on('mouseleave', '.scheme-place-available', function () {

                var self = $(this),
                    placeId = self.data('place-id'),
                    isCellSelected = self.toggleClass('scheme-cell-selected').hasClass('scheme-cell-selected');

                toggleAllCellsOfPlace(placeId, isCellSelected);

            });

            $(document).on('click', '.scheme-place-available', function () {

                $.blockUI();

                var data = {
                    action: 'add_to_cart',
                    scheme_id: scheme_id,
                    event_id: event_id,
                    place_id: $(this).data('place-id')
                };

                $.post(bap_object.ajaxurl, data, function (response) {
                    if (response == '0') {
                        refreshScheme();
                        $.unblockUI({
                            onUnblock: function() {
                                $("#scheme-warning-message").dialog('open');
                            }
                        });
                    } else {
                        refreshSchemeAndCartCallback(response);
                        $.unblockUI();
                    }
                });

                return false;

            });

            $(document).on('click', '.delete_from_cart', function () {

                $.blockUI();

                var data = {
                    action: 'delete_from_cart',
                    scheme_id: scheme_id,
                    event_id: event_id,
                    place_id: $(this).data('place-id')
                };

                $.post(bap_object.ajaxurl, data, function (response) {
                    refreshSchemeAndCartCallback(response);
                    $.unblockUI();
                });

                return false;

            });
        }

        function toggleAllCellsOfPlace(placeId, isCellsOfPlaceSelected) {
            $(".scheme-place-" + placeId).each(function () {
                var cell = $(this);
                if (isCellsOfPlaceSelected) {
                    cell.addClass('scheme-cell-selected');
                } else {
                    cell.removeClass('scheme-cell-selected');
                }
            });
        }

        function validateEmail(email) {
            var pattern = /^([^\s@]+@[^\s@]+\.[^\s@]+)$/;
            return pattern.test(email);
        }

        function validatePhone(phone) {
            var pattern = /^\d+$/;
            return pattern.test(phone);
        }
		

    });
}(jQuery));

//select delivery option
		function selectDelivery(obj){
			var el, s, s1, n, v;
				el = obj.options;
				n = el.selectedIndex;
				v = el[n].value;
				s = obj.id+'-self';
				s1 = obj.id+'-help';
			switch (v) {//switch number of options in the drop down with delivery options
				case "0":
					if(document.getElementById(s)){
						document.getElementById(s).style.display="none";//hide a drop down to select the address
					}
					if(document.getElementById(s1)){
						document.getElementById(s1).style.display="none";//hide an input to fill in the self address to deliver to
					}
				break;
				case "1"://delivery
					if(document.getElementById(s)){
						document.getElementById(s).style.display="none";//hide a drop down to select the address
					}
					if(document.getElementById(s1)){
						document.getElementById(s1).style.display="block";//view an input to fill in the self address to deliver to
					}
				break;
				case "2"://for self delivery
					if(document.getElementById(s)){
						document.getElementById(s).style.display="block";//view a drop down to select the address
					}
					if(document.getElementById(s1)){
						document.getElementById(s1).style.display="none";//hide an input to fill in the self address to deliver to
					}
				break;
			}
		};
		function selectHeadlineDelivery(obj){
		var el, n, v;
				el = obj.options;
				n = el.selectedIndex;
				v = el[n].value;
		switch (v) {//switch number of options in the drop down with delivery options
				case "0":
					if(document.getElementById('headline-self')){
						document.getElementById('headline-self').style.display="none";//hide a drop down to select the address
					}
					if(document.getElementById('headline-help')){
						document.getElementById('headline-help').style.display="none";//hide an input to fill in the self address to deliver to
					}
				break;
				case "1"://delivery
					if(document.getElementById('headline-self')){
						document.getElementById('headline-self').style.display="none";//hide a drop down to select the address
					}
					if(document.getElementById('headline-help')){
						document.getElementById('headline-help').style.display="block";//view an input to fill in the self address to deliver to
					}
				break;
				case "2"://for self delivery
					if(document.getElementById('headline-self')){
						document.getElementById('headline-self').style.display="block";//view a drop down to select the address
					}
					if(document.getElementById('headline-help')){
						document.getElementById('headline-help').style.display="none";//hide an input to fill in the self address to deliver to
					}
				break;
			}
		}