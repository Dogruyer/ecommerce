var timerDisplayFormat = ' \
	<div class="timerContent"> \
		<div class="timerDay"><span>{day}</span><span>GÃ¼n</span></div> \
		<div class="timerHour"><span>{hour}</span><span>Saat</span></div> \
		<div class="timerMinute"><span>{minute}</span><span>Dk.</span></div> \
	</div> \
';
var timerFinishMessage = '<div class="timerFinish">Kampanya SÃ¼resi DolmuÅŸtur!</div>';

function TimeControl(id, useCountDown, startDate, endDate, expireDate){
    if(parseInt(useCountDown)==0){
        return;
    }
    var nowDate     = new Date();
    var startDate   = new Date(startDate);
    var expireDate  = new Date(expireDate);
    var endDate     = new Date(endDate);
    if(expireDate.getTime() > endDate.getTime() && endDate.getTime() > startDate.getTime() && nowDate.getTime() > startDate.getTime() && expireDate.getTime() > nowDate.getTime()){
        var diffEnd   = new Date(endDate - nowDate);
        CountBack(Math.floor(diffEnd.valueOf()/1000),id,expireDate.getTime());
    }else{
        return;
    }
}
	
function calcage(secs, num1, num2) {
	var s = ((Math.floor(secs/num1))%num2).toString();
	if (s.length < 2){
		s = "0" + s;
	}
	return  s;
}
	
function CountBack(secs,id,expireDate) {
    var nowDate   = new Date();
	if (secs < 0) {
        if(nowDate.getTime() > expireDate){
            // usecountdown tutucusunun iÃ§eriÄŸi remove edilecek.
            if(jQuery(".countDownWrapper_"+id).length != undefined){
                jQuery(".countDownWrapper_"+id).remove();
            }
            // sepete at butonlarÄ± display:block yapÄ±lmakta
            if(jQuery("#Item_Anchor_"+id).length != undefined){
                jQuery("#Item_Anchor_"+id).css('display','block');
            }
            // fÄ±rsat kaÃ§tÄ± butonu remove edilmekte.
            if(jQuery("#countDownButton_"+id).length != undefined){
                jQuery("#countDownButton_"+id).remove();
            }
            // QuickOrder var ise onu display block yapmalÄ±yÄ±z.
            if(jQuery("#QuickOrder_"+id).length != undefined){
                jQuery("#QuickOrder_"+id).css('display','block');
            }
            return;
        }else{
            // sepete at butonlarÄ± display:none olup.
            if(jQuery("#Item_Anchor_"+id).length != undefined){
                jQuery("#Item_Anchor_"+id).css('display','none');
            }
            // QuickOrder var ise onu display none yapmalÄ±yÄ±z.
            if(jQuery("#QuickOrder_"+id).length != undefined){
                jQuery("#QuickOrder_"+id).css('display','none');
            }
        }
        jQuery(".countdown_"+id).html(timerFinishMessage);
        setTimeout("CountBack("+ (secs-1) + ",'"+id+"',"+expireDate+");",expireDate-nowDate.getTime());
		return;
	}
    var displayStr = "";
	var day = calcage(secs,86400,100);
	if(isNaN(day)){
		displayStr = timerFinishMessage;
	}else{
		displayStr = timerDisplayFormat.replace(/{day}/g,day);
		displayStr = displayStr.replace(/{hour}/g, calcage(secs,3600,24));
		displayStr = displayStr.replace(/{minute}/g, calcage(secs,60,60));
		displayStr = displayStr.replace(/{second}/g, calcage(secs,1,60));
	}
    jQuery(".countdown_"+id).html(displayStr);
    setTimeout("CountBack("+ (secs-1) + ",'"+id+"',"+expireDate+");",1000);
}
 