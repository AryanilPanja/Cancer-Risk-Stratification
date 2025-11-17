#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>

#define PORT 8080
#define CHUNCKI 25
#define BUF_MAX 4096

typedef struct chunckinfo {
    int seq_num;
    char packet[CHUNCKI];
    int tot_chuncks;
} ci;

// Function to send a message in chunks
void send_chunks(int s, struct sockaddr_in *client_addr, socklen_t addr_len, char *message) {
    int len = strlen(message);
    int total_packets = len / CHUNCKI;
    int last_pack_size = len % CHUNCKI;
    if (last_pack_size > 0) total_packets++;

    ci *packets = (ci *)malloc(total_packets * sizeof(ci));

    // Prepare and send all chunks
    for (int i = 0; i < total_packets; i++) {
        packets[i].seq_num = i + 1;
        packets[i].tot_chuncks = total_packets;
        if (i == total_packets - 1 && last_pack_size > 0) {
            memcpy(packets[i].packet, message + i * CHUNCKI, last_pack_size);
            packets[i].packet[last_pack_size] = '\0';
        } else {
            memcpy(packets[i].packet, message + i * CHUNCKI, CHUNCKI);
        }
        sendto(s, &packets[i], sizeof(ci), 0, (struct sockaddr *)client_addr, addr_len);
        printf("Server sent chunk %d: %s\n", packets[i].seq_num, packets[i].packet);
    }

    // Wait for acknowledgments
    int *ack_received = (int *)calloc(total_packets, sizeof(int));
    while (1) {
        int ack;
        recvfrom(s, &ack, sizeof(int), 0, (struct sockaddr *)client_addr, &addr_len);
        if (ack > 0 && ack <= total_packets && ack_received[ack - 1] == 0) {
            printf("Server received ACK for chunk %d\n", ack);
            ack_received[ack - 1] = 1;
        }

        int all_acknowledged = 1;
        for (int i = 0; i < total_packets; i++) {
            if (ack_received[i] == 0) {
                all_acknowledged = 0;
                break;
            }
        }

        if (all_acknowledged) {
            printf("All server chunks acknowledged.\n");
            break;
        }
    }

    free(packets);
    free(ack_received);
}

// Function to receive chunks and send acknowledgments
void receive_chunks(int s, struct sockaddr_in *client_addr, socklen_t addr_len) {
    char final_data[BUF_MAX] = {0};
    ci packet;
    int total_packets = 0, received_packets = 0;
    int *received_order = NULL;

    while (1) {
        recvfrom(s, &packet, sizeof(ci), 0, (struct sockaddr *)client_addr, &addr_len);
        printf("Server received chunk %d: %s\n", packet.seq_num, packet.packet);

        if (received_packets == 0) {
            total_packets = packet.tot_chuncks;
            received_order = (int *)calloc(total_packets, sizeof(int));
        }

        if (received_order[packet.seq_num - 1]) continue;
        memcpy(final_data + (packet.seq_num - 1) * CHUNCKI, packet.packet, strlen(packet.packet));
        received_order[packet.seq_num - 1] = 1;
        received_packets++;

        sendto(s, &packet.seq_num, sizeof(int), 0, (struct sockaddr *)client_addr, addr_len);
        printf("Server sent ACK for chunk %d\n", packet.seq_num);

        if (received_packets == total_packets) {
            printf("All client chunks received. Final message: %s\n", final_data);
            break;
        }
    }

    free(received_order);
}

int main() {
    struct sockaddr_in server_addr, client_addr;
    socklen_t addr_len = sizeof(client_addr);

    int s = socket(AF_INET, SOCK_DGRAM, 0);
    if (s < 0) {
        perror("Socket creation error");
        exit(EXIT_FAILURE);
    }

    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    if (bind(s, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("Bind failed");
        exit(EXIT_FAILURE);
    }

    printf("Server is running on port %d\n", PORT);

    // Initial message from the server to the client
    send_chunks(s, &client_addr, addr_len, "Hi client");

    while (1) {
        // Receive client's response
        receive_chunks(s, &client_addr, addr_len);

        // Server takes input from the user and sends it to the client
        char message[BUF_MAX];
        printf("Server: Enter message to send to the client: ");
        fgets(message, BUF_MAX, stdin);
        message[strcspn(message, "\n")] = 0; // Remove newline from input

        // Send server's message to the client
        send_chunks(s, &client_addr, addr_len, message);
    }

    close(s);
    return 0;
}
