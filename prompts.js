function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}
function ordinal(i){
    //this function took me a while to write
    var ones = texts.ordinal.ones;
    var onesSingle = texts.ordinal.onesSingle;
    var teens = texts.ordinal.teens;
    var tens = texts.ordinal.tens;
    var tensSingle = texts.ordinal.tensSingle;
    if (i < 0) return;
    if (i < 10) {
        return ones[i];
    }
    var getTens = function(x){
        if (x % 10 == 0) {
            return tens[(x/10)-1];
        } else {
            if (Math.floor(x/10) == 1) {
                return teens[x-11];
            } else {
                return tensSingle[Math.floor(x/10-2)]+"-"+ones[x-(Math.floor(x/10)*10)];
            }
        }
    };
    if (i < 100) {
        return getTens(i);
    }
    if (i < 1000) {
        var hundredthsString = onesSingle[Math.floor(i/100)-1]+"-"+texts.ordinal.hundred;
        if (i % 10 == 0) {
            return hundredthsString + texts.ordinal.hundredth;
        } else {
            var tn = Number(i.toString().substring(1,3));
            return hundredthsString + texts.ordinal.joiner + (tn<10?ones[tn]:getTens(tn));
        }
    }
    return (i.toString())+(texts.ordinal.other[Number(i.toString().substr(i.toString().length-1,1))]);
};
function shuffle(r){
    var j, x, i, a = [...r];
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
var keys = {};
function getRandomWord(){
    return rulesWordlist[Math.floor(Math.random()*rulesWordlist.length)];
}
function getRandomUniqueWord(key){
    if (!keys[key]) keys[key] = [];
    var word = getRandomWord();
    while (keys[key].includes(word)) {
        word = getRandomWord();
        var doesntInclude = false;
        rulesWordlist.forEach(word => {
            if (!keys[key].includes(word)) doesntInclude = true;
        });
        if (!doesntInclude) keys[key] = [];
    }
    keys[key].push(word);
    return word;
}
function capitalize(word){
    return word.substring(0,1).toUpperCase() + word.substring(1);
}
function capitalizeLower(word){
    return capitalize(word.toLowerCase());
}
function rarestLetterInStrings(param1){
    //adapted into JS from Jackbox code, hence the strange variable names
    var _loc4_ = 0;
    var _loc5_ = null;
    var _loc6_ = null;
    var _loc7_ = 0;
    var _loc2_ = {};
    //using the modern forEach method here; the original code had "for each(_loc3_ in param1)" so I thought this was sufficient
    param1.forEach(_loc3_ => {
        _loc7_ = 0;
        while(_loc7_ < _loc3_.length)
        {
            if(_loc2_.hasOwnProperty(_loc3_.charAt(_loc7_)))
            {
                _loc2_[_loc3_.charAt(_loc7_)] = _loc2_[_loc3_.charAt(_loc7_)] + 1;
            }
            else
            {
                _loc2_[_loc3_.charAt(_loc7_)] = 1;
            }
            _loc7_++;
        }
    });
    _loc4_ = 9999; //this was int.MAX_VALUE in the original code but I felt that using 9999 would be fine
    _loc5_ = "";
    for(_loc6_ in _loc2_)
    {
        if(_loc2_[_loc6_] < _loc4_)
        {
            _loc4_ = _loc2_[_loc6_];
            _loc5_ = _loc6_;
        }
    }
    return _loc5_;
}
function rulesPrompt(){
    return [...arguments].join(" ");
}
var currentGlobalKey = 0;
var rulesPromptGenerators = [
    function(numChoices){
        var doTap = Math.random() < 0.5;
        var buttonIndex = Math.floor(Math.random()*numChoices);
        var prompt = rulesPrompt(doTap?texts.tapthe:texts.donttapthe, ordinal(buttonIndex+1), texts.buttonend);

        var choices = [];
        for (var i = 0; i < numChoices; i++) {
            choices.push({text: texts.button, correct: !doTap});
        }
        choices[buttonIndex].correct = doTap;
        
        return {prompt, choices};
    },
    function(numChoices){
        var doTap = Math.random() < 0.5;
        var isOdd = Math.random() < 0.5;
        var prompt = rulesPrompt(doTap?texts.tapan:texts.donttapan, isOdd?texts.odd:texts.even, texts.numberend);

        var getEONumber = function(even){
            var nn = getRndInteger(1, 50);
            var nnie = nn % 2 == 0;
            while (even?(!nnie):nnie) {
                nn = getRndInteger(1, 50);
                nnie = nn % 2 == 0;
            }
            return nn;
        };

        var choices = [];
        var addEOP = function(even){
            choices.push({
                text: getEONumber(even),
                correct: (even == !isOdd) ? doTap : !doTap
            });
        };
        var mid = Math.floor(numChoices / 2);
        for (var i = 0; i < mid; i++) addEOP(true);
        for (var i = 0; i < numChoices - mid; i++) addEOP(false);

        return {prompt, choices: shuffle(choices)};
    },
    function(numChoices){
        var doTap = Math.random() < 0.5;
        var longest = Math.random() < 0.5;
        var prompt = rulesPrompt(doTap?texts.tapthe:texts.donttapthe, longest?texts.longest:texts.shortest, texts.wordend);

        var words = [];
        var key = currentGlobalKey.toString();
        currentGlobalKey++;
        for (var i = 0; i < numChoices; i++) {
            words.push(getRandomUniqueWord(key));
        }

        var maxLength = Math[longest?"max":"min"](...words.map(w => w.length));
        var choices = words.map(word => {return {text: capitalize(word), correct: (word.length==maxLength)?doTap:!doTap};});

        return {prompt, choices};
    },
    function(numChoices){
        var doTap = Math.random() < 0.5;
        var largest = Math.random() < 0.5;
        var prompt = rulesPrompt(doTap?texts.tapthe:texts.donttapthe, largest?texts.largest:texts.smallest, texts.numberend);

        var numbers = [];
        for (var i = 0; i < numChoices; i++) {
            numbers.push(getRndInteger(1, 50));
        }

        var maxValue = Math[largest?"max":"min"](...numbers);
        var choices = numbers.map(number => {return {text: number, correct: (number==maxValue)?doTap:!doTap};})

        return {prompt, choices};
    },
    function(numChoices){
        var doTap = Math.random() < 0.5;
        var words = [];
        var key = currentGlobalKey.toString();
        currentGlobalKey++;
        for (var i = 0; i < numChoices; i++) {
            words.push(getRandomUniqueWord(key));
        }
        var letter = rarestLetterInStrings(words);
        var prompt = rulesPrompt(doTap?texts.letter:texts.dontletter, letter.toUpperCase());

        var choices = words.map(word => {return {text: capitalize(word), correct: (word.toLowerCase().includes(letter.toLowerCase()))?doTap:!doTap};});

        return {prompt, choices};
    }
];
var mathPromptGenerator = function(numChoices, hat){
    var operator = hat?"X":(Math.random()<0.5)?"+":"-";

    var multiplicationFactor = (hat?100:1);
    var generateFactor = function(){
        return getRndInteger(1, 12*multiplicationFactor);
    };
    var factor1 = generateFactor();
    var factor2 = generateFactor();

    var answer = operator=="+"?(factor1+factor2):operator=="-"?(factor1-factor2):operator=="X"?(factor1*factor2):0;
    var decoys = [];

    for (var i = 0; i < numChoices; i++) {
        decoys.push(answer-getRndInteger(1, 10*multiplicationFactor));
    }

    var answers = decoys.map(d => {return {text: d, correct: false}});
    answers[Math.floor(Math.random()*answers.length)] = {text: answer, correct: true};

    return {prompt: factor1+operator+factor2, choices: answers};
};

function generatePrompt(type, numChoices, hatOrRulesFunction){
    switch (type) {
        case "math":
            return mathPromptGenerator(numChoices, hatOrRulesFunction);
        case "rules":
            return rulesPromptGenerators[Math.floor(Math.random()*rulesPromptGenerators.length)](numChoices);
        default:
            return;
    }
}