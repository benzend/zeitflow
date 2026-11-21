//! `labelToVariableName` from `lib/workflow-engine.ts`.
//!
//! Lowercase, collapse runs of non-ASCII-alphanumeric characters to a single
//! underscore, and strip underscores from both ends. "Support Ticket" becomes
//! `support_ticket`. "Send Email!!!" becomes `send_email`.

pub fn label_to_variable_name(label: &str) -> String {
    let lower = label.to_lowercase();
    let mut out = String::new();
    let mut pending_underscore = false;
    let mut started = false;
    for ch in lower.chars() {
        if ch.is_ascii_alphanumeric() {
            if pending_underscore && started {
                out.push('_');
            }
            pending_underscore = false;
            started = true;
            out.push(ch);
        } else {
            pending_underscore = true;
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::label_to_variable_name;

    #[test]
    fn matches_frontend_examples() {
        assert_eq!(label_to_variable_name("Support Ticket"), "support_ticket");
        assert_eq!(label_to_variable_name("Send Email!!!"), "send_email");
        assert_eq!(label_to_variable_name("User-Data"), "user_data");
        assert_eq!(label_to_variable_name("___Test___"), "test");
        assert_eq!(label_to_variable_name("UserData"), "userdata");
        assert_eq!(label_to_variable_name(""), "");
    }
}
