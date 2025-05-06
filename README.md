# Celestia DA Layer Metrics Checker

![da_metrics](https://github.com/user-attachments/assets/d73b189f-8cec-42ad-9671-c026a99c956f)

**Celestia DA Layer Metrics Checker** is the ultimate tool for ensuring the reliability and security of your Celestia DA Nodes. Built with the community in mind, this user-friendly solution makes it easy to verify and monitor the health of your DA nodes, giving you peace of mind and optimal performance every time.

---

## Key Features

1. **Direct Message Alerts**  
   Receive private, real-time alerts straight to your Discord DMs—never miss a critical node event or warning again.

2. **Ephemeral Info Messages**  
   Keep community channels clean with status updates that auto-delete after a configurable timeout and are visible only to you.

3. **Resolved Messages**  
   Whenever a previously detected issue has been resolved, the service issues a “resolved” message, confirming that normal operations have been restored.

4. **Support for Mainnet & Testnet**  
   Monitor both Celestia mainnet and testnet nodes with identical workflows and consistent alerting across environments.

5. **User-Defined Alert Thresholds (Upcoming, will be added in the future)**  
   Customize sensitivity on peer drops, block stalls, sync lag and more to match your personal monitoring preferences.

6. **Zero-Install**  
   Completely server-free monitoring—there’s nothing to deploy outside Discord. Configure and run the bot without leaving your chat. 

---

## Alerts list

1. **Low Peer Count Alert**  
   Automatically notifies you when your node loses peers, ensuring you’re aware of potential connectivity issues.

2. **Stalled Blocks Alert**  
   Alerts you if the block height fails to increase over a set time period (default: 10 minutes), helping you identify synchronization or performance bottlenecks quickly.

3. **Node Sync Alert**  
   Triggers a notification if your node falls behind the network (by more than 50 blocks), so you can take immediate corrective actions.

4. **No Archival Peers Alert**  
   Warns you if the monitored node is not running in archival mode, allowing you to address potential data unavailability issues.

---

## Supported Commands

- `/subscribe`  
  Allows you to subscribe to one or more nodes to receive health and status updates for each one.

- `/unsubscribe`  
  Enables you to remove your existing subscriptions for selected nodes, helping you keep your monitoring list organized.

- `/info`  
  Fetches detailed information about your subscribed nodes, including:  
  - Node ID
  - Node Type(Bridge, Light, Full)
  - Active Alerts  
  - Build Version  
  - Go Version  
  - Last Commit  
  - Build Time  
  - System Version  

---

## How to Use

Below is a concise, step-by-step guide to get you up and running with Celestia DA Metrics Checker, complete with screenshots to illustrate the process.

### 1. Make sure you have Direct Messages enabled
<img width="1006" alt="image" src="https://github.com/user-attachments/assets/37fd49a9-14ed-40c3-a655-c987e6f4ed1e" />

Otherwise bot will not be able to send messages via DM.

### 2. Choose the `/subscribe` Option
<img width="785" alt="image" src="https://github.com/user-attachments/assets/4575b622-0b05-4c0d-95ee-638104ba6282" />

When you open the command interface, you’ll see a list of available commands. Select the **`/subscribe`** command to begin monitoring a new DA Node.  

### 3. Choose the Instance and Press Enter
<img width="873" alt="image" src="https://github.com/user-attachments/assets/a0bbfef2-b640-4f61-9f9f-a956083142cf" />

After selecting `/subscribe`, you can specify the **Node ID** you wish to monitor. Simply choose the relevant node ID from the dropdown suggestions (or type it out manually) and press **Enter**.

### 4. You’re In!
<img width="856" alt="image" src="https://github.com/user-attachments/assets/ab093e41-6297-4101-aec3-0c62a6af6d38" />

Once you’ve confirmed the node ID, Celestia DA Metrics Checker will post a **Subscription Success** message, indicating that you are now actively monitoring the specified node. From this point on, you will receive alerts and updates tailored to that node’s status.

*These straightforward steps ensure you can quickly start monitoring and maintaining the health of your Celestia DA Node. For details on other commands or configuration tips, check out the [How to Use](#how-to-use) and [Examples](#examples) sections.*

---

## Examples

Below are real-world screenshots illustrating how to interact with the Celestia DA Metrics Checker through its commands and alerts.

### Examples

#### 1. Subscribing to a Node
<img width="873" alt="image" src="https://github.com/user-attachments/assets/a0bbfef2-b640-4f61-9f9f-a956083142cf" />
<img width="856" alt="image" src="https://github.com/user-attachments/assets/ab093e41-6297-4101-aec3-0c62a6af6d38" />



In this screenshot, the user runs the `subscribe` command to begin monitoring a specific DA Node.  
- **Command Used:** `/subscribe`  
- **Outcome:** The bot confirms a successful subscription and provides the node’s unique identifier (`12D3K...`), confirming that any alerts or updates for this node will now be sent to the user.


#### 2. Unsubscribing from a Node
<img width="866" alt="image" src="https://github.com/user-attachments/assets/ed48b9b4-b9d0-4943-98ae-aee3f9da7d83" />
<img width="850" alt="image" src="https://github.com/user-attachments/assets/53eaf2ba-4139-426a-846b-fd5edc8d6cff" />



Here, the user decides to stop monitoring a previously subscribed node.  
- **Command Used:** `/unsubscribe`  
- **Outcome:** The bot notifies the user that they have successfully unsubscribed from the specified node (`12D3K...`). Any alerts associated with this node will no longer be delivered.


#### 3. Viewing Node Information
<img width="866" alt="image" src="https://github.com/user-attachments/assets/546bb0e6-a386-4e1a-8060-07be084ea300" />



Using the `info` command, the user obtains detailed data for all subscribed nodes.  
- **Command Used:** `/info`  
- **Information Returned:**  
  - **Node ID:** `12D3K...`
  - **Node Type:** `Bridge`
  - **Alerts:** `🟢 Your node is synced and have no active alerts.`
  - **Build Version:** `v0.22.2`  
  - **Go Version:** `go1.21.3`  
  - **Last Commit:** `d57107...`  
  - **Build Time:** `Fri Feb 7 17:21:23 UTC 2025`  
  - **System Version:** `amd64/linux`

This overview helps users quickly verify that the node’s software and environment match their expectations.


#### 4. Receiving an Alert
<img width="1104" alt="image" src="https://github.com/user-attachments/assets/14458662-7558-42d1-a9a2-0d333d97f734" />

When the bot detects a potential issue—such as the node falling more than 50 blocks behind—it automatically sends an alert to prompt swift action.  
- **Alert Message:** **Warning! Node Sync Alert**  
- **Details:** The node `12D3K...` is out of sync, indicating that it lags behind the current block height.  
- **User Tag:** The message includes a tag (e.g., `@d`) to ensure the relevant user is immediately informed.


#### 5. Receiving a Resolve Message
<img width="1104" alt="image" src="https://github.com/user-attachments/assets/f65a54bb-052d-4897-a3e4-091c1aaa751c" />

Once the bot confirms that a previously alerted condition is resolved, it sends a “Resolved” message.  
- **Resolved Message:** **Resolved! Node Sync Alert**  
- **Details:** The node `12D3K...` is now synchronized.  
- **Significance:** This quick confirmation gives users peace of mind that their node has recovered without needing to check manually.

These examples demonstrate how Celestia DA Layer Metrics Checker streamlines nodes monitoring, enabling you to respond rapidly to any issues and stay updated when they are resolved.

---

## Contributing

We welcome all contributions to Celestia DA Layer Metrics Checker! If you have ideas for new features, improvements, or bug fixes, feel free to open a pull request. We encourage open collaboration and appreciate your help in making this tool even more robust and user-friendly.

If you prefer to discuss or propose improvements privately, or if you need further assistance, please send us an email at **contact@dteam.tech**. We’re excited to collaborate with the community to continually enhance this service.
