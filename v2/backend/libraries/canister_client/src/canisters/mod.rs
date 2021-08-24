#[macro_use]
mod macros {
    macro_rules! generate_update_call {
        ($method_name:ident) => {
            pub async fn $method_name(
                agent: &Agent,
                canister_id: &Principal,
                args: &$method_name::Args,
            ) -> $method_name::Response {
                let method_name = stringify!($method_name);
                let response = agent
                    .update(canister_id, method_name)
                    .with_arg(Encode!(args).expect(&format!("Failed to serialize '{}' args", method_name)))
                    .call_and_wait(delay())
                    .await
                    .expect(&format!("Failed to call '{}'", method_name));

                Decode!(response.as_slice(), $method_name::Response)
                    .expect(&format!("Failed to deserialize '{}' response", method_name))
            }
        };
    }

    macro_rules! generate_query_call {
        ($method_name:ident) => {
            pub async fn $method_name(
                agent: &Agent,
                canister_id: &Principal,
                args: &$method_name::Args,
            ) -> $method_name::Response {
                let method_name = stringify!($method_name);
                let response = agent
                    .query(canister_id, method_name)
                    .with_arg(Encode!(args).expect(&format!("Failed to serialize '{}' args", method_name)))
                    .call()
                    .await
                    .expect(&format!("Failed to call '{}'", method_name));

                Decode!(response.as_slice(), $method_name::Response)
                    .expect(&format!("Failed to deserialize '{}' response", method_name))
            }
        };
    }
}

#[allow(dead_code)]
pub mod group;

#[allow(dead_code)]
pub mod group_index;

#[allow(dead_code)]
pub mod notifications;

#[allow(dead_code)]
pub mod user;

#[allow(dead_code)]
pub mod user_index;