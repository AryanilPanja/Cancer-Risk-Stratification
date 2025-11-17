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

int main() {
    struct sockaddr_in server_addr, client_addr;
    socklen_t addr_len = sizeof(client_addr);
    char final_data[BUF_MAX] = {0};  // Buffer to store the reconstructed message

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

    ci packet;
    int total_packets = 0;
    int received_packets = 0;
    int *received_order = NULL;  // Array to track which packets have been received

    while (1) {
        recvfrom(s, &packet, sizeof(ci), 0, (struct sockaddr *)&client_addr, &addr_len);
        printf("Received chunk %d: %s\n", packet.seq_num, packet.packet);

        // On first packet, allocate memory for all chunks based on total_chunks
        if (received_packets == 0) {
            total_packets = packet.tot_chuncks;
            received_order = (int *)calloc(total_packets, sizeof(int));  // Track received chunks
        }

        // If the packet has already been received, skip reprocessing
        if (received_order[packet.seq_num - 1]) {
            continue;
        }

        // Store the received chunk in the correct place
        memcpy(final_data + (packet.seq_num - 1) * CHUNCKI, packet.packet, strlen(packet.packet));

        // Mark this packet as received
        received_order[packet.seq_num - 1] = 1;
        received_packets++;

        // Simulate packet loss by skipping every third chunk's ACK
        // Comment this section for the final submission
        
        // if (packet.seq_num % 3 == 0) {
        //     printf("Skipping ACK for chunk %d to simulate packet loss\n", packet.seq_num);
        //     continue;
        // }
        

        // Send ACK for the received packet
        sendto(s, &packet.seq_num, sizeof(int), 0, (struct sockaddr *)&client_addr, addr_len);
        printf("Sent ACK for chunk %d\n", packet.seq_num);

        // If all packets have been received, break the loop
        if (received_packets == total_packets) {
            printf("All packets received. Reconstructing the message...\n");
            break;
        }
    }

    // Print the final reconstructed message
    printf("Final message: %s\n", final_data);

    free(received_order);
    close(s);

    return 0;
}
