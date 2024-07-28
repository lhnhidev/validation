function Validator (options) {
    var formElement = document.querySelector(options.form);
    var selectorValue = {};

    //Lấy parent gần nhất của element
    function getParent (element, parent) {
        while (element.parentElement) {
            if (element.parentElement.matches(parent)) {
                return element.parentElement;
            }
            else {
                element = element.parentElement;
            }
        }
    }
     /** */

    //Hàm thêm class invalid
    function addWarning (messageError, inputElement) {
        var spanElement = getParent(inputElement, options.formGroup).querySelector(options.errorMessage);
        spanElement.innerText = messageError;
        getParent(inputElement, options.formGroup).classList.add(options.editError);
    }
    /** */

    //Hàm xóa class invalid
    function removeWarning (inputElement) {
        var spanElement = getParent(inputElement, options.formGroup).querySelector(options.errorMessage);
        spanElement.innerText = '';
        getParent(inputElement, options.formGroup).classList.remove(options.editError);
    }
    /** */

    if (formElement) {
        //Đẩy các rule (method) cần test của các element vào một object
        options.rules.forEach (function (rule) {
            if (Array.isArray(selectorValue[rule.selector])) {
                selectorValue[rule.selector].push(rule.test);
            }
            else {
                selectorValue[rule.selector] = [rule.test];
            }
        });
        /** */

        options.rules.forEach (function (rule) {
            var inputElements = formElement.querySelectorAll(rule.selector);

            //Onblur ra ngoài bắt đầu cho chạy các method để kiểm tra
            inputElements.forEach (function (inputElement) {
                inputElement.onblur = function () {
                    selectorValue[rule.selector].forEach (function (test) {
                        if (!getParent(inputElement, options.formGroup).classList.contains(options.editError)) {
                            var messageError = test(inputElement.value);
                            if (messageError) {
                                addWarning(messageError, inputElement);
                            }
                        }
                    });
                }

                //Khi thực hiện điền lại thì auto xóa class invalid đi
                inputElement.oninput = function () {
                    if (getParent(inputElement, options.formGroup).classList.contains(options.editError)) {
                        removeWarning(inputElement);
                    }
                }
                /** */

            });
            /** */
        });
    }

    formElement.onsubmit = function (e) {
        e.preventDefault(); //Bỏ sự kiện submit mặc định của form

        var isValid = true; //Mặc định thông tin lấy được là hợp lệ
        options.rules.forEach (function (rule) {
            var inputElements = formElement.querySelectorAll(rule.selector);
            inputElements.forEach (function (inputElement) {
                selectorValue[rule.selector].forEach (function (test) {
                    if (!getParent(inputElement, options.formGroup).classList.contains(options.editError)) {
                        var checkRadio = false;
                        var messageError;
                        switch (inputElement.type) {
                            case 'checkbox':
                            case 'radio':
                                if (checkRadio == false) {
                                    var checked = false;
                                    inputElements.forEach(function (item) {
                                        if (item.checked) checked = true;
                                    });
                                    if (!checked) {
                                        messageError = test('');
                                    }
                                    checkRadio = true;
                                }
                                break;
                            default: 
                                messageError = test(inputElement.value);
                        }
                        if (messageError) { //Có lỗi ~ không hợp lệ => thêm invalid và gán isValid lại bằng false
                            addWarning(messageError, inputElement);
                            isValid = false;
                        }
                    }
                    else {
                        isValid = false;
                    }
                });

            });
        });

        //Tạo object lưu thông tin lấy được
        if (isValid) {
            // console.log('Lấy dữ liệu thành công');
            var enableInputs = formElement.querySelectorAll('[name]:not([disabled])');
            options.onSubmit = [...enableInputs].reduce (function (value, input) {
                switch (input.type) {
                    case 'checkbox':
                        if (input.checked) {
                            if (!Array.isArray(value[input.name])) {
                                value[input.name] = [input.id];
                            }
                            else {
                                value[input.name].push(input.id);
                            }
                        }
                        break;
                    case 'radio':
                        if (input.checked) {
                            value[input.name] = input.id;
                        }
                        break;
                    default:
                        value[input.name] = input.value;
                }
                return value;
            }, {});

            var informationUser = '';
            for (var item in options.onSubmit) {
                informationUser += `${item}: ${options.onSubmit[item]}<br/>`;
            }

            // console.log(informationUser);
            Email.send({
                Host : "smtp.elasticemail.com",
                Username : "lhnhi420@gmail.com",
                Password : "5E20BD1C19936442B3D956B543BEB31AFC64",
                To : 'lhnhi420@gmail.com',
                From : "lhnhi420@gmail.com",
                Subject : "Information of " + options.onSubmit.fullName,
                Body : informationUser
            }).then(
                message => {
                    if (message == 'OK') {
                        swal("Good job!", "Thanks for signing up", "success");
                    }
                    else {
                        swal("Oops!", "Please try again", "error");
                    }
                }
            );
            // console.log(options.onSubmit); //In object vừa nhập được
        }
        else {
            // console.log('Lấy dữ liệu thất bại');
            isValid = true;
        }
        /** */
    }
}

Validator.isRequired = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            return value.trim() ? undefined : message || 'Trường này là bắt buộc.';
        }
    }
}

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là email.';
        }
    }
}

Validator.isPassword = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!#$%&? "]).*$/;
            return regex.test(value) ? undefined : message || 'Mật khẩu tối thiểu 8 ký tự, phải có ít nhất một chữ in hoa, in thường, chữ số và ký tự đặc biệt.';
        }
    }
}

Validator.isPasswordConfirm = function (passwordConfirm, getPassword, message) {
    return {
        selector: passwordConfirm,
        test: function (value) {
            var currentPassword = getPassword();
            return value == currentPassword.value ? undefined : message || 'Xác thực mật khẩu không chính xác.'
        }
    }
}