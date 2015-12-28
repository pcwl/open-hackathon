/*
 * Copyright (c) Microsoft Open Technologies (Shanghai) Co. Ltd.  All rights reserved.
 *
 * The MIT License (MIT)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function ($, oh) {
    'use strict';

    var hackathon_name = oh.comm.getCurrentHackathon();

    function teamsbind(data) {
        var list = $('#team_list').append($('#team_list_temp').tmpl(data, {
            get_logo: function (logo) {
                return logo ? logo : '/static/pic/team-logo.png';
            },
            get_description: function (description) {
                return (description || '').substr(0, 60);
            },
            get_link: function (id) {
                return '/site/' + hackathon_name + '/team/' + id;
            }
        }));
    }

    function pageLoad() {
        getTeamList().then(function (data) {
            if (data.error) {
                showNoTeam();
            } else if (data.length > 0) {
                $('#team span').text('（' + data.length + '）');
                var btn = $('<button>')
                    .addClass('btn btn-default btn-sm btn-block')
                    .text('更多')
                    .bind('click', function (e) {
                        teamsbind(data.splice(0, 8))
                        if (data.length == 0) {
                            btn.detach();
                        }
                    }).trigger('click');
                $('#team_list').after(btn);
            } else {
                showNoTeam();
            }
        });

        function getTeamlink(team_id, tag) {
            return '/site/' + hackathon_name + '/team/' + team_id + tag;
        }

        getShowList().then(function (data) {
            if (data.error) {

            } else {
                $('#works span').text('（' + data.length + '）');
                $('#team_show').append($('#show_list_temp').tmpl(data, {
                    getImage: function (uri) {
                        var uris = uri.split(',');
                        var image_url = '/static/pic/wutu.jpg';
                        $.each(uris, function (i, o) {
                            var u_t = o.split(':::');
                            if (u_t[1] == '0') {
                                image_url = u_t[0];
                                return;
                            }
                        });
                        return image_url;
                    },
                    getAlt: function (uri, note) {
                        var uris = uri.split(',');
                        var src = note;
                        $.each(uris, function (i, o) {
                            var u_t = o.split(':::');
                            if (u_t[1] == '0' && u_t[0].search('.baidu.com') > -1) {
                                src = '百度图片拒绝外链！';
                                return;
                            }
                        });
                        return src
                    },
                    getlinks: function (uri, team_id) {
                        var uris = uri.split(',');
                        var links = '';
                        $.each(uris, function (i, o) {
                            var u_t = o.split(':::');
                            var type = +u_t[1];
                            if (type == 0 && links.search('#works_img') == -1) {
                                links += '<a href="' + getTeamlink(team_id, '#works_img') + '">图片</a>';
                            } else if (type == 1 && links.search('#works_video') == -1) {
                                links += '<a href="' + getTeamlink(team_id, '#works_video') + '">视频</a>';
                            } else if (type == 2 && links.search('#works_code') == -1) {
                                links += '<a href="' + getTeamlink(team_id, '#works_code') + '">源代码</a>';
                            } else if (type >= 3 && type <= 6 && links.search('#works_doc') == -1) {
                                links += '<a href="' + getTeamlink(team_id, '#works_doc') + '">文档</a>';
                            }
                        });
                        return links;
                    },
                    link: function (team_id) {
                        return getTeamlink(team_id, '');
                    }
                }));
            }
        });
    }

    function showNoTeam() {
        $('#team_list').append('<div class="col-md-12 text-center no-team"><img  src="/static/pic/no-team.png"><div>')
    }

    function getTeamList() {
        return oh.api.hackathon.team.list.get({header: {hackathon_name: hackathon_name}});
    }

    function getShowList() {
        return oh.api.hackathon.show.list.get({header: {hackathon_name: hackathon_name}})
    }

    function submintRegister() {
        var regieter_btn = $('a[data-type="register"]').click(function (e) {
            e.preventDefault();
            oh.api.user.registration.post({
                // body: {hackathon_name: hackathon_name},
                header: {hackathon_name: hackathon_name}
            }, function (data) {
                if (data.error) {

                    if (data.error.code == 420) {
                        var confim = $('body').Dialog({
                            title: '提示',
                            body: data.error.friendly_message,
                            footer: [

                                $('<button class="btn btn-warning">取消</button>').click(function (e) {
                                    confim.hide();
                                }),
                                $('<button class="btn btn-primary">切换登录</button>').click(function (e) {
                                    confim.hide();
                                    window.location.href = '/logout?return_url=/login?return_url=' + encodeURIComponent('/site/' + hackathon_name + '&provides=' + data.error.provides);
                                })
                            ],
                            modal: 'confirm'
                        });
                    } else {
                        oh.comm.alert('错误', data.error.friendly_message);
                    }
                } else {
                    var message = $('#status').empty();
                    if (data.status == 0) {
                        message.append('<p>您的报名正在审核中，请等待。</p>');
                    } else if (data.status == 2) {
                        message.append('<p>您的报名已被拒绝，如有疑问请联系主办方。</p>');
                    } else {
                        message.append('<a class="btn btn-primary btn-lg" href="/site/' + hackathon_name + '/settings">立即参加</a>\
                                <p>您的报名已经审核已通过。</p>');
                    }
                }
            })
        });
    }

    function init() {
        pageLoad();
        submintRegister();
    };

    $(function () {
        init();
    });

})(window.jQuery, window.oh);