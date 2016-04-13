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
    var tid = 0;
    var lid = 0;
    var uid = 0;
    var team_date = {};

    var templates = {
        video: '<div class="sub-item">{{html uri}}</div>',
        img: '<a href="${uri}" title="${description}" data-parent><img src="${uri}" onload="oh.comm.imgLoad(this)" alt="${description}"></a>',
        doc: '<div class="sub-item"><iframe src="${uri}" seamless="seamless" frameborder="0" scrolling="yes"></iframe></div>',
        pdf: '<div class="sub-item"><object data="${uri}" type="application/pdf" width="100%" height="470px"><p>您的浏览器不支持PDF查看。请安装PDF阅读器插件!</p></object></div>',
        code: '<div class="sub-item"><span>${description}：</span><a href="${uri}" target="_blank">${uri}</a></div>',
        other: '<div class="sub-item"><span>${description}：</span><a href="${uri}" target="_blank">${uri}</a></div>'
    };

    function office_app(team_show) {
        if (team_show.type == 3 || team_show.type == 4 || team_show.type == 5) {
            team_show.uri = "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(team_show.uri)
        }
        return team_show
    }

    function splitShow(data) {
        var _data = {video: [], img: [], code: [], doc: [], pdf: [], other: []};
        $.each(data, function (i, o) {
            switch (o.type) {
                case 0:
                    _data.img.push(o);
                    break;
                case 1:
                    _data.video.push(o);
                    break;
                case 2:
                    _data.code.push(o);
                    break;
                case 6:
                    _data.pdf.push(o)
                    break;
                case 3:
                case 4:
                case 5:
                    _data.doc.push(office_app(o))
                    break;
                default:
                    _data.other.push(o)
                    break;
            }
        });
        return _data;
    }

    function showMember() {
        getMemberList().then(function (data) {
            $('#team_member h2 span').text('(' + data.length + ')');
            $('#talent_list').empty().append($('#team_item').tmpl(data, {
                getTitle: function (id, status) {
                    if (id == lid) {
                        return '队长';
                    } else if (status != 1) {
                        return '等待加入';
                    }
                    return '成员';
                },
                isNotLeader: function (id) {
                    return id != lid;
                },
                getUserLogo: function (logo) {
                    return logo.length == 0 ? '/static/pic/anon_user.png' : logo;
                }
            }));
        });
    }


    function bindShow(data) {
        if (data.video.length > 0) {
            $.tmpl(templates.video, data.video).appendTo('#videos .w-videos');
        } else {
            $('#videos .nothing').removeClass('hide');
        }
        if (data.img.length > 0) {
            $.tmpl(templates.img, data.img).appendTo('#work_images');
        } else {
            $('#images .nothing').removeClass('hide');
        }
        if (data.doc.length == 0 && data.pdf.length == 0) {
            $('#docs .nothing').removeClass('hide');
        } else {
            $.tmpl(templates.pdf, data.pdf).appendTo('#docs .w-doc');
            $.tmpl(templates.doc, data.doc).appendTo('#docs .w-doc');
        }

        if (data.code.length > 0) {
            $('#code').removeClass('hide');
            $.tmpl(templates.code, data.code).appendTo('#code .w-code');
        }

        if (data.other.length > 0) {
            $('#other').removeClass('hide');
            $.tmpl(templates.other, data.other).appendTo('#code .w-code');
        }
    }

    function pageload() {
        $('[data-loadsrc]').each(function (i, img) {
            var $img = $(img).load(function (e) {
                oh.comm.imgLoad(this);
            })
            $img.attr({src: $img.attr('data-loadsrc')});
        });

        $('.popup-gallery').magnificPopup({
            delegate: 'a',
            type: 'image',
            tLoading: '加载图片 #%curr%...',
            mainClass: 'mfp-img-mobile',
            gallery: {
                enabled: true,
                navigateByImgClick: true,
                preload: [0, 1]
            },
            image: {
                tError: '<a href="%url%">图片 #%curr%</a> 无法加载。',
                titleSrc: function (item) {
                    return item.el.attr('title');
                }
            }
        });

        tid = $('[data-tid]').data('tid');
        lid = $('[data-lid]').data('lid');
        uid = $('[data-uid]').data('uid');
        team_date.id = tid;
        showMember();

        getShow().then(function (data) {
            if (!data.error) {
                $("#show_count").val("（" + data.length + "）")
                var split_data = splitShow(data);
                bindShow(split_data);
            } else {
            }
        });


        if (uid !== '') {
            getScore().then(function (data) {
                if (data.my) {
                    $('#score_form').detach();
                    $('#score_list').append($('#score_item').tmpl(data.all));
                } else {
                    $('#score_form').removeClass('hide');
                }
            });
        }


        var editLogo_form = $('#editLogoForm').bootstrapValidator()
            .on('success.form.bv', function (e) {
                e.preventDefault();
                var logo = editLogo_form.find('#logo').val();
                $('#team_logo').attr({src: logo});
                $('#teamLogoModal').modal('hide');
                updateTeam({id: tid, logo: logo}).then(function (data) {
                    if (data.error) {
                        oh.comm.alert('错误', data.error.friendly_message);
                    }
                });
            });

        $('#score_form').bootstrapValidator()
            .on('success.form.bv', function (e) {
                e.preventDefault();
                var data = {
                    id: $('#score_form').data('score_id') || 0,
                    team_id: tid,
                    score: parseInt($('input:radio[name="trophies-rating"]:checked').val()),
                    reason: $('#comment').val()
                };

                (data.id == 0 ? submitScore(data) : updateScore(data)).then(function (data) {
                    if (data.error) {
                        oh.comm.alert('错误', data.error.friendly_message);
                    } else {
                        oh.comm.alert('提示', '评分成功');
                        $('#score_form').detach();
                        $('#score_list').append($('#score_item').tmpl(data.all));
                    }
                })
            });

        var worksForm = $('#addWorksForm').bootstrapValidator()
            .on('success.form.bv', function (e) {
                e.preventDefault();
                var data = {
                    team_id: tid,
                    type: +worksForm.find('#worktype').val(),
                    note: worksForm.find('[name="note"]').val(),
                    uri: worksForm.find('[data-gtype].active [data-name="uri"]').val()
                };
                addShow(data).then(function (data) {
                    if (data.error) {
                        oh.comm.alert('错误', data.error.friendly_message);
                    } else {
                        // $('#works_video').append($('#show_item').tmpl([data]));
                    }
                });
                works_Modal.modal('hide');
                worksForm.data().bootstrapValidator.resetForm();
            });


        var worktype = $('#worktype').change(function (e) {
            var type = parseInt(worktype.val());
            var gtypename = 'video';
            switch (type) {
                case 0:
                    gtypename = 'image';
                    break;
                case 1:
                    break;
                case 2:
                    gtypename = 'code';
                    break
                case 3:
                case 4:
                case 5:
                case 6:
                    gtypename = 'doc';
                    break
                case 99:
                    gtypename = 'other';
                    break;
            }
            worksForm.find('[data-gtype]').removeClass('active');
            worksForm.find('[data-gtype="' + gtypename + '"]').addClass('active');
            worksForm.data().bootstrapValidator.resetForm();
        });

        var works_Modal = $('#works_Modal')
            .on('hide.bs.modal', function (e) {
                $('#addWorksForm').get(0).reset();
                worksForm.data().bootstrapValidator.resetForm();
            });

        $('#team_works').on('click', 'a[data-role="delete-show"]', function (e) {
            var item = $(this).parents('.work_item');
            deleteShow({team_id: tid, id: item.data('tmplItem').data.id}).then(function (data) {
                if (data.error) {
                    oh.comm.alert('错误', data.error.friendly_message);
                } else {
                    item.detach();
                    $('#team_works h2 span').text('(' + $('#team_works .work_item').length + ')');
                }
            });
        });
    }

    function getMemberList() {
        return oh.api.team.member.list.get({query: {team_id: tid}, header: {hackathon_name: hackathon_name}});
    }

    function joinTeam(data) {
        return oh.api.team.member.post({body: {team_id: tid}, header: {hackathon_name: hackathon_name}});
    }

    function leaveTeam(user_id) {
        return oh.api.team.member.delete({
            query: {user_id: user_id, team_id: tid},
            header: {hackathon_name: hackathon_name}
        });
    }

    function updateMemberStatus(rel_id, status) {
        var data = {
            id: rel_id,
            status: status
        };
        return oh.api.team.member.put({body: data, header: {hackathon_name: hackathon_name}});
    }

    function deniedMember(rel_id) {
        return updateMemberStatus(rel_id, 2);
    }

    function approvedMember(rel_id) {
        return updateMemberStatus(rel_id, 1);
    }

    function updateTeam(data) {
        return oh.api.team.put({body: data, header: {hackathon_name: hackathon_name}});
    }

    function addShow(data) {
        return oh.api.team.show.post({body: data, header: {hackathon_name: hackathon_name}});
    }

    function deleteShow(data) {
        return oh.api.team.show.delete({query: data, header: {hackathon_name: hackathon_name}});
    }

    function getShow() {
        return oh.api.team.show.get({query: {team_id: tid}, header: {hackathon_name: hackathon_name}});
    }

    function getScore() {
        return oh.api.team.score.get({query: {team_id: tid}, header: {hackathon_name: hackathon_name}});
    }

    function submitScore(data) {
        return oh.api.team.score.post({body: data, header: {hackathon_name: hackathon_name}});
    }

    function updateScore(data) {
        return oh.api.team.score.pus({body: data, header: {hackathon_name: hackathon_name}});
    }

    function bindEvent() {
        $('.oh-team-edit').on('click', '[data-role="leave"]', function (e) {
            oh.comm.confirm('提示', '确定离队吗？', function () {
                leaveTeam(uid).then(function (data) {
                    if (data.error) {
                        oh.comm.alert('错误', data.error.friendly_message);
                    } else {
                        window.location.reload();
                    }
                });
            });
        });

        $('[data-role="addworks"]').click(function (e) {
            $('#works_Modal').modal('show');
        });


        $('[data-role="join"]').click(function (e) {
            joinTeam().then(function (data) {
                if (data.error) {
                    oh.comm.alert('错误', data.error.friendly_message);
                } else {
                    showMember();
                    $('.oh-team-edit').empty().append('<a href="javascript:void(0);" class="btn oh-white-text bg-color-pinkDark btn-lg" data-role="leave"><i class="fa fa-unlink"></i> 离队</a>');
                }
            });
        });

        var edit_btn = $('[data-role="edit"]').click(function (e) {
            edit_btn.addClass('hide');
            seva_btn.removeClass('hide');
            var input_name = $('<input>').attr({type: 'text', value: $('#team_name').text()});
            var input_des = $('<textarea>').attr({row: '4'}).val($('#team_description').text());
            $('#team_name').addClass('edit').empty().append(input_name);
            $('#team_description').addClass('edit').empty().append(input_des);
        });

        var seva_btn = $('[data-role="save"]').click(function (e) {
            seva_btn.addClass('hide');
            edit_btn.removeClass('hide');
            $('.team-pic').removeClass('edit').find('inner-edit').detach();
            team_date.name = $('#team_name').removeClass('edit').find('input').val();
            team_date.description = $('#team_description').removeClass('edit').find('textarea').val();
            $('[data-role="team_name"]').text(team_date.name);
            $('#team_name').empty().text(team_date.name);
            $('#team_description').empty().text(team_date.description);

            updateTeam(team_date).then(function (data) {
                if (data.error) {
                    oh.comm.alert('错误', data.error.friendly_message);
                }
            });
        });

        $('body').on('click', '[data-role="logo-edit"]', function (e) {
            $('#teamLogoModal').modal('show');
        });


        $('#talent_list').on('click', '[data-role="denied"]', function (e) {
            var rel_id = $(this).data('id');
            var userItem = $(this).parents('[data-user]');
            deniedMember(rel_id).then(function (data) {
                if (data.error) {
                    oh.comm.alert('错误', data.error.friendly_message);
                } else {
                    userItem.detach();
                    $('#team_member h2 span').text('(' + $('#talent_list>[data-user]').length + ')');
                }
            });
        }).on('click', '[data-role="approved"]', function (e) {
            var btn = $(this);
            var rel_id = btn.data('id');
            var userItem = btn.parents('[data-user]');
            approvedMember(rel_id).then(function (data) {
                if (data.error) {
                    oh.comm.alert('错误', data.error.friendly_message);
                } else {
                    btn.parents('.btn-group').detach();
                    userItem.find('.oh-body span').text('成员')
                }
            });
        });
    }

    function init() {
        bindEvent();
        pageload();
    };

    $(function () {
        init();
    });

})(window.jQuery, window.oh);