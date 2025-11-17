#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/time.h>
#include <sys/select.h>

#define PORT 8080
#define MAX_BUF 4096
#define CHUNCKI 256
#define TIMEOUT_SEC 0
#define TIMEOUT_USEC 100000 // 0.1 second

typedef struct chunckinfo {
    int seq_num;             // Sequence number
    char packet[CHUNCKI];    // Data chunk
} ci;

int main() {
    struct sockaddr_in server_addr;
    socklen_t addr_len = sizeof(server_addr);
    char buf[MAX_BUF];
    fd_set read_fds;
    struct timeval timeout;

    int s = socket(AF_INET, SOCK_DGRAM, 0);
    if (s < 0) {
        printf("Socket creation error!\n");
        exit(EXIT_FAILURE);
    }

    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(PORT);

    if (inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr) <= 0) {
        perror("Invalid address/ Address not supported");
        exit(EXIT_FAILURE);
    }

    FILE *f;
    char *data;
    long file_size;
    int total_packets;
    int last_pack_size;

    f = fopen("text", "rb");
    if (f == NULL) {
        perror("Error opening file");
        return 1;
    }

    fseek(f, 0, SEEK_END);
    file_size = ftell(f);
    rewind(f);
    data = (char *)malloc((file_size + 1) * sizeof(char));
    if (data == NULL) {
        perror("Memory allocation failed");
        fclose(f);
        return 1;
    }
    fread(data, sizeof(char), file_size, f);
    data[file_size] = '\0';
    fclose(f);

    total_packets = file_size / CHUNCKI;
    last_pack_size = file_size % CHUNCKI;
    if (last_pack_size > 0) {
        total_packets++;
    }

    printf("Total data size: %ld bytes\n", file_size);
    printf("Total packets: %d\n", total_packets);

    // Send the total number of packets to the server first
    sendto(s, &total_packets, sizeof(int), 0, (struct sockaddr *)&server_addr, addr_len);

    ci *packets = (ci *)malloc(total_packets * sizeof(ci));
    if (packets == NULL) {
        printf("Error allocating memory!\n");
        free(data);
        return 1;
    }

    // Initialize packets
    for (int i = 0; i < total_packets; i++) {
        packets[i].seq_num = i + 1;

        if (i == total_packets - 1 && last_pack_size > 0) {
            memcpy(packets[i].packet, data + i * CHUNCKI, last_pack_size);
            packets[i].packet[last_pack_size] = '\0';
        } else {
            memcpy(packets[i].packet, data + i * CHUNCKI, CHUNCKI);
        }

        printf("Chunk %d created\n", packets[i].seq_num);
    }

    int ack;
    int sent_packets[total_packets];
    memset(sent_packets, 0, sizeof(sent_packets));  // 0 means not acknowledged

    int i = 0;
    while (i < total_packets) {
        // Send packets that have not been acknowledged
        if (!sent_packets[i]) {
            char send_buffer[sizeof(int) + CHUNCKI];

            memcpy(send_buffer, &packets[i].seq_num, sizeof(int));
            if (i == total_packets - 1 && last_pack_size > 0) {
                memcpy(send_buffer + sizeof(int), packets[i].packet, last_pack_size);
            } else {
                memcpy(send_buffer + sizeof(int), packets[i].packet, CHUNCKI);
            }

            int packet_size = (i == total_packets - 1 && last_pack_size > 0)
                              ? sizeof(int) + last_pack_size
                              : sizeof(int) + CHUNCKI;

            sendto(s, send_buffer, packet_size, 0, (struct sockaddr *)&server_addr, addr_len);
            printf("Sent packet %d\n", packets[i].seq_num);
        }

        // Set up timeout for 0.1 seconds
        FD_ZERO(&read_fds);
        FD_SET(s, &read_fds);
        timeout.tv_sec = TIMEOUT_SEC;
        timeout.tv_usec = TIMEOUT_USEC;

        // Check if ACK is received within timeout
        int ready = select(s + 1, &read_fds, NULL, NULL, &timeout);

        if (ready > 0) {
            // Receive ACK
            recvfrom(s, &ack, sizeof(int), 0, (struct sockaddr *)&server_addr, &addr_len);
            printf("Received ACK for packet %d\n", ack);
            sent_packets[ack - 1] = 1;  // Mark the packet as acknowledged

            // Move to the next packet
            if (i == ack - 1) {
                i++;
            }
        } else if (ready == 0) {
            // Timeout occurred, no ACK received
            printf("Timeout for packet %d, resending...\n", packets[i].seq_num);
        } else {
            perror("Error in select");
            break;
        }
    }

    free(data);
    free(packets);
    close(s);
    return 0;
}
