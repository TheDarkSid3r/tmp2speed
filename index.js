Swal.fire({
    title: "Loading&hellip;",
    icon: "info",
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false
});

var rulesWordlist = [];
var originalTexts = {};
var texts = {};

$(function(){
    $(".start-form").on("submit", function(e){
        e.preventDefault();

        var values = $(this).serializeArray();
        var promptType = values.find(v => v.name == "prompt-type").value;
        var choices = Number(values.find(v => v.name == "choices").value);
        var time = Number(values.find(v => v.name == "time").value);
        var hov = values.find(v => v.name == "hat");
        var hat = hov ? hov.value == "on" : false;
        var iov = values.find(v => v.name == "increase");
        var increase = iov ? iov.value == "on" : false;
        /* var oov = values.find(v => v.name == "opposite");
        var opposite = oov ? oov.value == "on" : false; */
        if (isNaN(choices)) choices = 4;
        if (choices < 1) choices = 1;
        if (choices > 100) choices = 100;
        if (isNaN(time)) time =304;
        if (time < 1) time = 1;
        if (time > 600) time = 600;

        /* if (opposite) {
            Object.keys(texts.opposite).forEach(key => {
                texts[key] = texts.opposite[key];
            });
        } else {
            texts = originalTexts;
        } */

        startGame(promptType, choices, hat, increase, time);

        return false;
    });

    var doGameCountdown = function(number, callback){
        if (number <= 0) {
            if (callback) callback();
            return;
        }
        $(".game-countdown").html(number).fadeIn(300);
        setTimeout(function(){
            $(".game-countdown").fadeOut(300);
        }, 500);
        setTimeout(function(){
            doGameCountdown(number-1, callback);
        }, 1000);
    };

    var doTimer = function(number, callback){
        if (number <= 0) {
            if (callback) callback();
            return;
        }
        $(".game-timer").html(number);
        setTimeout(function(){
            doTimer(number-1, callback);
        }, 1000);
    };

    var showResults = function(data){
        $(".results-wrapper").show();
        $(".results-content").html("");
        data.forEach(stat => {
            var wrapper = $("<div/>").addClass("result-wrapper");
            if (stat.wide) wrapper.addClass("result-wrapper-wide");
            var title = $("<div/>").addClass("result-title").html(stat.title);
            var more = [];
            var text = $("<div/>").addClass("result-text").addClass("result-"+stat.type+"-text").html(stat.type=="number"&&!isNaN(stat.value)?Number(stat.value).toLocaleString():stat.type=="bool"?(stat.value?"Yes":"No"):stat.value);
            more.push(text);
            if (stat.extra) {
                var button = $("<div/>").addClass("result-extra-button");
                more.push(button);
                if (stat.extra.type == "questions") {
                    button.html("View Questions");
                    var qwrapper = $("<div/>").addClass("result-questions-wrapper");
                    stat.extra.data.forEach(question => {
                        var qw = $("<div/>").addClass("result-questions-question");
                        var pr = $("<div/>").addClass("result-questions-question-prompt").html(question.prompt);
                        var chs = $("<div/>").addClass("result-questions-question-choices");
                        qw.append(pr, chs);
                        question.choices.forEach(ch => {
                            var che = $("<div/>").addClass("result-questions-question-choice").addClass("result-questions-question-choice-"+(ch.correct?"correct":"incorrect")).html(ch.text);
                            if (ch.picked/*  || (!question.answeredCorrectly && ch.correct) */) che.addClass("result-questions-question-choice-picked");
                            chs.append(che);
                        });
                        qwrapper.append(qw);
                    });
                    button.click(function(){
                        qwrapper.slideToggle();
                    });
                    more.push(qwrapper);
                }
            }
            wrapper.append(title, ...more);
            $(".results-content").append(wrapper);
        });
        $(".results-wrapper").css({width: 1200});
        $(".result-extra-button,.result-questions-wrapper,.results-download").hide();
        html2canvas($(".results-wrapper")[0]).then(canvas => {
            $(".results-wrapper").css({width: "100%"});
            $(".result-extra-button,.results-download").show();
            $(".results-download")[0].onclick = function(){
                var link = $("<a/>").attr({download: "results.png", href: canvas.toDataURL("png")});
                $(document.body).append(link);
                link[0].click();
                link.remove();
            };
        });
    };


    $.get("wordlistRules.txt", function(words){
        rulesWordlist = words.split("\n");
        $.getJSON("texts.json", function(data){
            texts = data;
            originalTexts = data;
            Swal.close();
        });
    });


    var answeredQuestions = [];
    var frozenTimeout = null;


    var startGame = function(type, choices, hat, increase, time){
        console.log("Starting game");
        $(".starting-wrapper").hide();
        $(".game-wrapper").show();
        doGameCountdown(3, function(){
            $(".game-content").show();
            answeredQuestions = [];
            showPrompt(type, choices, hat, increase);
            $(".game-timer").show();
            var timerTime = time;
            doTimer(timerTime, function(){
                console.log("TIME'S UP");
                clearTimeout(frozenTimeout);
                $(".game-wrapper").hide();
                $(".game-content").hide();
                $(".game-timer").hide();
                $(".starting-wrapper").show();
                var avgATime = timerTime/answeredQuestions.length;
                var correctQuestions = answeredQuestions.filter(q => q.answeredCorrectly);
                var incorrectQuestions = answeredQuestions.filter(q => !q.answeredCorrectly);
                var correctPS = correctQuestions.length/timerTime;
                var totalPS = answeredQuestions.length/timerTime;

                var percent = Math.round(correctQuestions.length/answeredQuestions.length*100);
                var letterGrades = [
                    {min: 0, max: 59, letter: "F"},
                    {min: 60, max: 62, letter: "D-"},
                    {min: 63, max: 66, letter: "D"},
                    {min: 67, max: 69, letter: "D+"},
                    {min: 70, max: 72, letter: "C-"},
                    {min: 73, max: 76, letter: "C"},
                    {min: 77, max: 79, letter: "C+"},
                    {min: 80, max: 82, letter: "B-"},
                    {min: 83, max: 86, letter: "B"},
                    {min: 87, max: 89, letter: "B+"},
                    {min: 90, max: 92, letter: "A-"},
                    {min: 93, max: 96, letter: "A"},
                    {min: 97, max: 100, letter: "A+"},
                ];
                var letterGrade = "--";
                letterGrades.forEach(function(gd){
                    if (percent >= gd.min && percent <= gd.max) letterGrade = gd.letter;
                });
                var resultData = [
                    {
                        title: "Type",
                        type: "text",
                        value: capitalizeLower(type)
                    },
                    {
                        title: "Number of Choices",
                        type: "number",
                        value: choices
                    },
                    {
                        title: "Dad Hat?",
                        type: "bool",
                        value: hat
                    },
                    {
                        title: "Increasing Choices?",
                        type: "bool",
                        value: increase
                    },
                    {
                        title: "Total Time",
                        type: "text",
                        value: timerTime+"s"
                    },
                    {
                        title: "Average Answering Time",
                        type: "text",
                        value: avgATime.toFixed(3)+"s"
                    },
                    /* {
                        title: "Correct Questions Per Second",
                        type: "text",
                        value: correctPS.toFixed(3)
                    },
                    {
                        title: "Total Questions Per Second",
                        type: "text",
                        value: totalPS.toFixed(3)
                    } */
                    {
                        title: "Accuracy",
                        type: "text",
                        value: percent+"%"
                    },
                    {
                        title: "Grade",
                        type: "text",
                        value: letterGrade
                    }
                ];
                if (answeredQuestions.length > 0) resultData.push({
                    title: "Total Questions Answered",
                    type: "number",
                    value: answeredQuestions.length,
                    extra: {
                        type: "questions",
                        data: answeredQuestions
                    },
                    wide: true
                });
                if (correctQuestions.length > 0) resultData.push({
                    title: "Correct Questions Answered",
                    type: "number",
                    value: correctQuestions.length,
                    extra: {
                        type: "questions",
                        data: correctQuestions
                    },
                    wide: true
                });
                if (incorrectQuestions.length > 0) resultData.push({
                    title: "Incorrect Questions Answered",
                    type: "number",
                    value: incorrectQuestions.length,
                    extra: {
                        type: "questions",
                        data: incorrectQuestions
                    },
                    wide: true
                });

                if (answeredQuestions.length <= 0) {
                    resultData = [{
                        title: "what",
                        type: "text",
                        value: "actually answer questions next time kthx"
                    }];
                }
                showResults(resultData);
            })
        });
    };

    var handleClick = function(object, choiceIndex, question, type, choices, hat, increase){
        if (increase) {
            choices = choices+1;
            if (choices > 100) choices = 100;
        }
        if (object.correct) {
            showPrompt(type, choices, hat, increase);
        } else {
            showActualPrompt({
                prompt: texts.frozen,
                choices: []
            });
            frozenTimeout = setTimeout(function(){
                showPrompt(type, choices, hat, increase);
            }, 2000);
        }
        question.answeredCorrectly = object.correct;
        question.choices[choiceIndex].picked = true;
        answeredQuestions.push(question);
    };

    var showPrompt = function(type, choices, hat, increase){
        var actualType = type;
        if (type == "both") actualType = ["math","rules"][Math.floor(Math.random()*2)];

        var prompt = generatePrompt(actualType, choices, hat);
        showActualPrompt(prompt, type, choices, hat, increase);
    };

    var showActualPrompt = function(object, type, choices, hat, increase){
        $(".game-prompt").html(object.prompt);
        $(".game-choices").html("");
        object.choices.forEach((choice, choiceIndex) => {
            var group = $("<div/>").addClass("choice-group");
            var button = $("<button/>").addClass("choice-button").html(choice.text);
            group.append(button);
            $(".game-choices").append(group);
            button.click(function(){
                handleClick(choice, choiceIndex, object, type, choices, hat, increase);
            });
        });
    };
});