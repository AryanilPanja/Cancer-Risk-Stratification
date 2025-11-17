#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <fcntl.h>
#include <errno.h>
#include <time.h>
#include <sys/time.h>  


#define MAX 4096
#define BUF_MAX 4096
#define PORT 8080
#define CHUNCKI 25
#define TIMEOUT_SEC 0
#define TIMEOUT_USEC 100000  // 0.1 seconds

typedef struct chunckinfo {
    int seq_num;
    char packet[CHUNCKI];
    int tot_chuncks;
} ci;

// Function to get the current time in microseconds
long get_current_time_usec() {
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return tv.tv_sec * 1000000L + tv.tv_usec;
}

int main(){
    char input[BUF_MAX];
    int total_packets;
    int last_pack_size;

    struct sockaddr_in server_addr;
    socklen_t addr_len = sizeof(server_addr);
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(PORT);

    int s = socket(AF_INET, SOCK_DGRAM, 0);
    if (s < 0) {
        printf("Socket creation error!\n");
        exit(EXIT_FAILURE);
    }

    if (inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr) <= 0) {
        perror("Invalid address/ Address not supported");
        exit(EXIT_FAILURE);
    }

    // Set socket timeout for receiving ACKs
    struct timeval timeout;
    timeout.tv_sec = TIMEOUT_SEC;
    timeout.tv_usec = TIMEOUT_USEC;
    setsockopt(s, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));

    // Get the input text
    printf("Enter the message to send: ");
    fgets(input, BUF_MAX, stdin);
    input[strcspn(input, "\n")] = 0;  // Remove the newline character from input

    // Divide the input into chunks
    int len = strlen(input);
    total_packets = len / CHUNCKI;
    last_pack_size = len % CHUNCKI;
    if (last_pack_size > 0) {
        total_packets++;
    }

    ci *packets = (ci *)malloc(total_packets * sizeof(ci));
    if (packets == NULL) {
        printf("Error allocating memory!\n");
        return 1;
    }

    // Prepare all the packets
    for (int i = 0; i < total_packets; i++) {
        packets[i].seq_num = i + 1;
        packets[i].tot_chuncks = total_packets;
        if (i == total_packets - 1 && last_pack_size > 0) {
            memcpy(packets[i].packet, input + i * CHUNCKI, last_pack_size);
            packets[i].packet[last_pack_size] = '\0';
        } else {
            memcpy(packets[i].packet, input + i * CHUNCKI, CHUNCKI);
        }
        printf("Chunk %d created: %s\n", packets[i].seq_num, packets[i].packet);
    }

    // Track ACKs and retransmissions
    int *ack_received = (int *)calloc(total_packets, sizeof(int)); // 0 = not received, 1 = received
    long *last_sent_time = (long *)calloc(total_packets, sizeof(long)); // Last sent time for each packet

    // Send all packets without waiting for ACKs
    for (int i = 0; i < total_packets; i++) {
        sendto(s, &packets[i], sizeof(ci), 0, (struct sockaddr *)&server_addr, addr_len);
        last_sent_time[i] = get_current_time_usec();  // Store the time the packet was sent
        printf("Sent chunk %d: %s\n", packets[i].seq_num, packets[i].packet);
    }

    // Check for acknowledgments and retransmit if necessary
    while (1) {
        // Try to receive an ACK (non-blocking due to timeout settings)
        int ack = -1;
        if (recvfrom(s, &ack, sizeof(int), 0, (struct sockaddr *)&server_addr, &addr_len) > 0) {
            if (ack > 0 && ack <= total_packets && ack_received[ack - 1] == 0) {
                printf("Received ACK for chunk %d\n", ack);
                ack_received[ack - 1] = 1;  // Mark this packet as acknowledged
            }
        }

        // Check for unacknowledged packets and resend them if the timeout has passed
        long current_time = get_current_time_usec();
        for (int i = 0; i < total_packets; i++) {
            if (ack_received[i] == 0 && (current_time - last_sent_time[i] > TIMEOUT_USEC)) {
                // Resend the packet if it hasn't been acknowledged and the timeout has passed
                sendto(s, &packets[i], sizeof(ci), 0, (struct sockaddr *)&server_addr, addr_len);
                last_sent_time[i] = current_time;  // Update the last sent time
                printf("Resending chunk %d: %s\n", packets[i].seq_num, packets[i].packet);
            }
        }

        // Check if all packets have been acknowledged
        int all_acknowledged = 1;
        for (int i = 0; i < total_packets; i++) {
            if (ack_received[i] == 0) {
                all_acknowledged = 0;
                break;
            }
        }

        if (all_acknowledged) {
            printf("All chunks acknowledged. Exiting...\n");
            break;
        }
    }

    // Clean up
    free(packets);
    free(ack_received);
    free(last_sent_time);
    close(s);

    return 0;
}
