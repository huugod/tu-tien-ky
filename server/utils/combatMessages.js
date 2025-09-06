const ATTACKER_MESSAGES = [
    "{attacker} tung một cú 'Thiên Tàn Cước', đá vào mặt {defender} gây {damage} sát thương.",
    "{attacker} vận công 'Hàng Long Thập Bát Chưởng', chưởng lực như núi thái sơn đè lên người {defender}, gây {damage} sát thương.",
    "{attacker} lén lút ném một viên gạch vào đầu {defender}, gây {damage} sát thương.",
    "{attacker} hét lớn 'Xem Thần Long Bái Vĩ của ta đây!', nhưng chỉ gây được {damage} sát thương.",
    "{attacker} rút dép lào ra táng thẳng vào mặt {defender}, gây {damage} sát thương.",
    "Với ánh mắt khinh bỉ, {attacker} búng nhẹ một cái, luồng kình khí khiến {defender} lùi lại, nhận {damage} sát thương.",
];

const DEFENDER_MESSAGES = [
    "{defender} không phải dạng vừa, phản công bằng 'Lục Mạch Thần Kiếm', khiến {attacker} nhận {damage} sát thương.",
    "{defender} gồng mình chịu đòn rồi tung 'Sư Tử Hống', làm {attacker} ù tai và nhận {damage} sát thương.",
    "{defender} cười khẩy, 'Gãi ngứa à?', rồi đấm trả một cú trời giáng, {attacker} nhận {damage} sát thương.",
    "{defender} lùi lại né đòn, tiện tay nhặt một hòn đá ném trả, {attacker} xui xẻo lĩnh trọn {damage} sát thương.",
    "Thấy {attacker} ra đòn, {defender} nhanh trí nằm lăn ra đất ăn vạ, đồng thời dùng chân đá lén, gây {damage} sát thương.",
];

const ATTACKER_FINISHERS = [
    "Bằng một đòn toàn lực, {attacker} hét 'Game là dễ!', tiễn {defender} về thành dưỡng sức.",
    "{attacker} tung ra tuyệt kỹ cuối cùng, {defender} không kịp ngáp đã nằm sõng soài trên đất.",
    "Một đòn kết liễu đẹp mắt! {attacker} phủi tay và nói: 'Trìnhแค่นี้ đòi solo với anh à?'",
];

const DEFENDER_FINISHERS = [
    "Trong lúc {attacker} đang mải múa may, {defender} tung một đòn chí mạng, kết liễu trận đấu!",
    "{defender} lật kèo ngoạn mục! {attacker} không hiểu chuyện gì vừa xảy ra.",
    "Kinh nghiệm đầy mình, {defender} chờ {attacker} hết mana rồi mới ra tay. Quá cao thủ!",
];

const PVP_WIN_SUMMARIES = [
    "Đối thủ của bạn chỉ là con gà. Gáy lên đi chứ!",
    "Bạn ra tay quá nặng, đạo hữu kia khóc thét bỏ chạy về mách mẹ.",
    "Một quyền tung ra, trời long đất lở. Đạo hữu kia chỉ biết quỳ xuống gọi bạn là 'bố'.",
    "Nhìn thấy thần thái của bạn, đối phương đã biết mình không có cửa và xin tha.",
    "Bạn đấm đối phương không trượt phát nào. Chắc chắn là hack!",
    "Trận đấu kết thúc chóng vánh, bạn thậm chí còn chưa kịp khởi động. Quá yếu!",
    "Sau trận đấu, đối thủ đã thêm bạn làm hảo hữu để bái sư học nghệ.",
    "Bạn nhẹ nhàng búng tay một cái, đối thủ đã bay xa ngàn dặm.",
    "Đối phương: 'Dừng lại! Ta nhận thua!'. Bạn: 'Muộn rồi cưng.'",
    "Đây không phải là luận đạo, đây là bạn đang bón hành cho đối thủ.",
];

const PVP_LOSE_SUMMARIES = [
    "Bạn đã bị vả cho lệch mồm, may mà chưa rụng cái răng nào.",
    "Đối phương quá mạnh, bạn bị hành cho ra bã như tương Bần.",
    "Bạn đã cố hết sức, nhưng núi cao còn có núi cao hơn, và bạn thì ở dưới đáy.",
    "Một chút sơ sẩy, bạn đã phải trả giá bằng cả hòm đồ.",
    "Thua keo này ta bày keo khác. Về tu luyện thêm rồi quay lại báo thù... nếu dám.",
    "Đối phương cười vào mặt bạn và nói: 'Chỉ có thế thôi à? Về bú thêm sữa mẹ đi.'",
    "Bạn nhận ra rằng người vừa đánh bại mình thực ra là một đại năng giả heo ăn thịt hổ.",
    "Trận thua này khiến đạo tâm bạn tổn thương, bạn quyết định đi bế quan 3 ngày 3 đêm để tự kỷ.",
    "Bạn cảm thấy mình như một con kiến hôi trước sức mạnh của đối thủ.",
    "Đối thủ vỗ vai bạn an ủi: 'Không sao, về nạp thêm tiền rồi quay lại nhé cưng.'",
];

module.exports = {
    ATTACKER_MESSAGES,
    DEFENDER_MESSAGES,
    ATTACKER_FINISHERS,
    DEFENDER_FINISHERS,
    PVP_WIN_SUMMARIES,
    PVP_LOSE_SUMMARIES
};
