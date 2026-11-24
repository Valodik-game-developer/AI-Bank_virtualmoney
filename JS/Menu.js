const supabaseUrl = "https://fqivpdrjfkmdxgegyuie.supabase.co";
const supabaseKey = "sb_publishable_GWz6xHkLI4doDJ3OYzRtfQ_ZPHXF0sP";

const supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);


// ==============================
// ЗАГРУЗКА ПРОФИЛЯ
// ==============================

async function loadProfile() {

    const { data: { user }, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !user) {
        window.location.href = "login.html";
        return;
    }

    console.log("Текущий пользователь:", user);

    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("username, balance")
            .eq("id", user.id)
            .single();

    if (profileError) {
        console.error("Ошибка профиля:", profileError);

        const menuMessage =
            document.getElementById("menuMessage");

        if (menuMessage) {
            menuMessage.textContent =
                "չստացվեց մուտք գործել պրոֆիլը, փորձեք կրկին";
        }

        return;
    }

    const usernameElement =
        document.getElementById("username");

    const balanceElement =
        document.getElementById("balance");

    if (usernameElement) {
        usernameElement.textContent =
            profile.username;
    }

    if (balanceElement) {
        balanceElement.textContent =
            profile.balance;
    }

    console.log("Профиль:", profile);
}


// ==============================
// ВЫХОД
// ==============================

async function logout() {

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {
        console.error(error);
        return;
    }

    window.location.href = "login.html";
}


// ==============================
// ПЕРЕХОД МЕЖДУ СТРАНИЦАМИ
// ==============================

function showPage(pageId) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(page => {
        page.classList.remove("active");
    });

    const page =
        document.getElementById(pageId);

    if (page) {
        page.classList.add("active");
    }


    const balanceElement =
        document.getElementById("balance");

    const statBalance =
        document.getElementById("statBalance");

    if (balanceElement && statBalance) {

        statBalance.textContent =
            balanceElement.textContent;
    }


    const username =
        document.getElementById("username");

    const cardUsername =
        document.getElementById("cardUsername");

    if (username && cardUsername) {

        cardUsername.textContent =
            username.textContent.toUpperCase();
    }
}


// ==============================
// ДЕМО-КНОПКА
// ==============================

function demoMessage() {

    alert(
        "Այս ֆունկցիան դեռ ակտիվ չի 🚀"
    );
}


// ==============================
// ТЁМНАЯ ТЕМА
// ==============================

function toggleDarkMode() {

    document.body.classList.toggle(
        "dark-mode"
    );
}


// ==============================
// ПЕРЕВОД ДЕНЕГ
// ==============================

async function sendMoney() {

    const receiverInput =
        document.getElementById("receiver");

    const amountInput =
        document.getElementById("amount");

    const message =
        document.getElementById("transferMessage");


    if (!receiverInput || !amountInput || !message) {
        console.error(
            "Не найдены элементы перевода"
        );
        return;
    }


    const receiver =
        receiverInput.value.trim();

    const amount =
        Number(amountInput.value);


    // Проверка получателя

    if (!receiver) {

        message.textContent =
            "Մուտքագրեք օգտատիրոջ անունը";

        return;
    }


    // Проверка суммы

    if (!amount || amount <= 0) {

        message.textContent =
            "Մուտքագրեք ճիշտ գումար";

        return;
    }


    // Получаем текущего пользователя

    const {
        data: { user },
        error: userError
    } =
        await supabaseClient.auth.getUser();


    if (userError || !user) {

        message.textContent =
            "Օգտատերը մուտք գործած չէ";

        return;
    }


    // ==============================
    // ИЩЕМ ПОЛУЧАТЕЛЯ
    // ==============================

    const {
        data: receiverProfile,
        error: receiverError
    } =
        await supabaseClient
            .from("profiles")
            .select("id, username, balance")
            .eq("username", receiver)
            .maybeSingle();


    if (receiverError) {

        console.error(
            "Ошибка поиска получателя:",
            receiverError
        );

        message.textContent =
            "Չհաջողվեց գտնել օգտատիրոջը";

        return;
    }


    if (!receiverProfile) {

        message.textContent =
            "Օգտատերը չի գտնվել";

        return;
    }


    // Нельзя отправить самому себе

    if (receiverProfile.id === user.id) {

        message.textContent =
            "Չեք կարող գումար ուղարկել ինքներդ ձեզ";

        return;
    }


    // ==============================
    // ПОЛУЧАЕМ БАЛАНС ОТПРАВИТЕЛЯ
    // ==============================

    const {
        data: senderProfile,
        error: senderError
    } =
        await supabaseClient
            .from("profiles")
            .select("balance")
            .eq("id", user.id)
            .single();


    if (senderError || !senderProfile) {

        console.error(
            "Ошибка отправителя:",
            senderError
        );

        message.textContent =
            "Չհաջողվեց ստանալ ձեր հաշվի տվյալները";

        return;
    }


    const senderBalance =
        Number(senderProfile.balance);


    const receiverBalance =
        Number(receiverProfile.balance);


    // ==============================
    // ПРОВЕРЯЕМ БАЛАНС
    // ==============================

    if (senderBalance < amount) {

        message.textContent =
            "Բավարար գումար չկա";

        return;
    }


    // ==============================
    // СПИСЫВАЕМ ДЕНЬГИ
    // ==============================

    const {
        error: senderUpdateError
    } =
        await supabaseClient
            .from("profiles")
            .update({
                balance:
                    senderBalance - amount
            })
            .eq("id", user.id);


    if (senderUpdateError) {

        console.error(
            "Ошибка списания:",
            senderUpdateError
        );

        message.textContent =
            "Փոխանցումը չհաջողվեց";

        return;
    }


    // ==============================
    // ЗАЧИСЛЯЕМ ПОЛУЧАТЕЛЮ
    // ==============================

    const {
        error: receiverUpdateError
    } =
        await supabaseClient
            .from("profiles")
            .update({
                balance:
                    receiverBalance + amount
            })
            .eq(
                "id",
                receiverProfile.id
            );


    if (receiverUpdateError) {

        console.error(
            "Ошибка зачисления:",
            receiverUpdateError
        );

        message.textContent =
            "Փոխանցման ժամանակ սխալ առաջացավ";

        return;
    }


    // ==============================
    // УСПЕШНЫЙ ПЕРЕВОД
    // ==============================

    message.textContent =
        "Փոխանցումը հաջողությամբ կատարվեց ✅";


    receiverInput.value = "";
    amountInput.value = "";


    // Обновляем баланс

    await loadProfile();
}


// ==============================
// ЗАПУСК
// ==============================

loadProfile();
